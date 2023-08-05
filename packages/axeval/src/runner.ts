import { Report } from './report';
import { wrap, time } from './utils';

import type { Model } from './model';
import type { EvalCase } from './evalCase';

type SuiteType = {
  model: Model;
  cases: EvalCase[];
  description: string;
};

export type RunnerOptionsType = {
  verbose: boolean;
};

export class Runner {
  private suites: SuiteType[] = [];
  private options: RunnerOptionsType;

  constructor(options?: RunnerOptionsType) {
    this.options = Object.assign({ verbose: false }, options);
  }

  register(description: string, model: Model, cases: EvalCase[]) {
    this.suites.push({ model, cases, description });
  }

  async run() {
    // For loops with await in them run each loop iteration one after the other, rather than in parallel.
    const pending = this.suites.map(async (suite) => {
      const { ms: timeMs, result: caseResults } = await time(() => this.runSuite(suite));
      const report = new Report({
        description: suite.description,
        timeMs: timeMs,
        results: caseResults,
      });
      console.log(report.toString(this.options.verbose));
    });

    await Promise.all(pending);
  }

  private async runSuite(suite: SuiteType) {
    const results = [];
    for (const evalCase of suite.cases) {
      results.push(await this.runCase(suite, evalCase));
    }
    return results.flat();
  }

  private async runCase(suite: SuiteType, evalCase: EvalCase) {
    const { ms: modelMs, result: response } = await time(() => suite.model.run(evalCase.prompt));

    const evaluators = wrap(evalCase.evaluation);

    // For loops with await in them run each loop iteration one after the other, rather than in parallel.
    const pendingResults = evaluators.map(async (evaluator) => {
      const { ms: evaluatorMs, result: score } = await time(() => evaluator.run(response));

      return {
        evalCase: evalCase,
        evaluator: evaluator,
        success: score === 1,
        score: score,
        latencyMs: modelMs + evaluatorMs,
        response: {
          output: response,
        },
      };
    });

    return Promise.all(pendingResults);
  }
}

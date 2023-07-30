import { Report } from './report';
import { wrap } from './utils';

import type { Model } from './model';
import type { EvalCase } from './evalCase';
import type { EvalResult } from './evalResult';

type SuiteType = {
  model: Model;
  cases: EvalCase[];
  description: string;
};

type RunnerOptionsType = {
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
    for (const suite of this.suites) {
      const report = await this.runSuite(suite);
      console.log(report.toString(this.options.verbose));
    }
  }

  private async runSuite(suite: SuiteType) {
    const startMs = Date.now();

    let caseResults: EvalResult[] = [];

    for (const evalCase of suite.cases) {
      const modelStartMs = Date.now();
      const response = await suite.model.run(evalCase.prompt);
      const modelStopMs = Date.now();
      const modelMs = modelStopMs - modelStartMs;
      const evaluators = wrap(evalCase.evaluation);

      const results = await Promise.all(
        evaluators.map(async (evaluator) => {
          const evaluatorStartMs = Date.now();
          const score = await evaluator.run(response);
          const evaluatorStopMs = Date.now();

          const evaluatorMs = evaluatorStopMs - evaluatorStartMs;

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
        })
      );

      caseResults = caseResults.concat(results);
    }

    const endMs = Date.now();

    return new Report({
      description: suite.description,
      timeMs: endMs - startMs,
      results: caseResults,
    });
  }
}

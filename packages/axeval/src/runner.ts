import { Report } from './report';

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
      const results = await Promise.all(
        evalCase.evalFunctions.map(async (fn) => {
          const evalFunctionStartMs = Date.now();
          const score = await fn.run(response);
          const evalFunctionStopMs = Date.now();

          const evalFunctionMs = evalFunctionStopMs - evalFunctionStartMs;

          return {
            evalCase: evalCase,
            evalFunction: fn,
            success: score === 1,
            score: score,
            latencyMs: modelMs + evalFunctionMs,
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

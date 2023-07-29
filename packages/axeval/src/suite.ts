import { ChatEvalCase, CompletionEvalCase } from "./evalCase";
import { EvalResult } from "./evalResult";
import { Report } from "./report";
import type { ChatModel, CompletionModel } from "./model";

export class ChatTestSuite {
  description: string;
  model: ChatModel;
  dataset: ChatEvalCase[];

  constructor(description: string, model: ChatModel, dataset: ChatEvalCase[]) {
    this.description = description;
    this.model = model;
    this.dataset = dataset;
  }

  async run() {
    const startMs = Date.now();

    let caseResults: EvalResult[] = [];

    for (const evalCase of this.dataset) {
      const modelStartMs = Date.now();
      const response = await this.model.run(evalCase.prompt);
      const modelStopMs = Date.now();
      const modelMs = modelStopMs - modelStartMs;
      const results = evalCase.evalFunctions.map((fn) => {
        const evalFunctionStartMs = Date.now();
        const score = fn.run(response, evalCase.idealOutput);
        const evalFunctionStopMs = Date.now();

        const evalFunctionMs = evalFunctionStopMs - evalFunctionStartMs;

        return {
          evalCase: evalCase,
          success: score === 1,
          score: score,
          latencyMs: modelMs + evalFunctionMs,
          response: {
            output: response,
          },
        };
      });

      caseResults = caseResults.concat(results);
    }

    const endMs = Date.now();

    return new Report({
      description: this.description,
      timeMs: endMs - startMs,
      results: caseResults,
    });
  }
}

export class CompletionTestSuite {
  description: string;
  model: CompletionModel;
  dataset: CompletionEvalCase[];

  constructor(
    description: string,
    model: CompletionModel,
    dataset: CompletionEvalCase[]
  ) {
    this.description = description;
    this.model = model;
    this.dataset = dataset;
  }

  async run() {
    const startMs = Date.now();

    let caseResults: EvalResult[] = [];

    for (const evalCase of this.dataset) {
      const modelStartMs = Date.now();
      const response = await this.model.run(evalCase.prompt);
      const modelStopMs = Date.now();
      const modelMs = modelStopMs - modelStartMs;
      const results = evalCase.evalFunctions.map((fn) => {
        const evalFunctionStartMs = Date.now();
        const score = fn.run(response, evalCase.idealOutput);
        const evalFunctionStopMs = Date.now();

        const evalFunctionMs = evalFunctionStopMs - evalFunctionStartMs;
        return {
          evalCase: evalCase,
          success: score === 1,
          score: score,
          latencyMs: modelMs + evalFunctionMs,
          response: {
            output: response,
          },
        };
      });

      caseResults = caseResults.concat(results);
    }

    const endMs = Date.now();

    return new Report({
      description: this.description,
      timeMs: endMs - startMs,
      results: caseResults,
    });
  }
}

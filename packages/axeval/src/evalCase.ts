import type { EvalResult } from './evalResult';
import { EvalFunction } from './evalFunction';
import { OpenAIChatMessage } from './model';

export interface EvalCase {
  description?: string;
  prompt: string | OpenAIChatMessage[];
  idealOutput: string;
  evalFunctions: EvalFunction[];
}

export interface ChatEvalCase extends EvalCase {
  prompt: OpenAIChatMessage[];
  idealOutput: string;
  evalFunctions: EvalFunction[];
}

export interface CompletionEvalCase extends EvalCase {
  prompt: string;
  idealOutput: string;
  evalFunctions: EvalFunction[];
}

export class ChatEvalCase implements EvalCase {
  prompt: OpenAIChatMessage[];
  idealOutput: string;
  evalFunctions: EvalFunction[];
  evalResults: EvalResult[] = [];

  constructor(
    messages: OpenAIChatMessage[],
    idealOutput: string,
    evalFunctions: EvalFunction[] = []
  ) {
    this.prompt = messages;
    this.idealOutput = idealOutput;
    this.evalFunctions = evalFunctions;
  }

  addEvalFunction(evalFunction: EvalFunction) {
    this.evalFunctions.push(evalFunction);
  }

  addEvalResults(evalResults: EvalResult[]) {
    this.evalResults.push(...evalResults);
  }
}

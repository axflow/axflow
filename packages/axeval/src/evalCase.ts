import type { EvalResult } from './evalResult';
import { EvalFunction } from './evalFunction';
import { OpenAIChatMessage } from './model';

export interface EvalCase {
  description?: string;
  prompt: string | OpenAIChatMessage[];
  evalFunctions: EvalFunction[];
}

export interface ChatEvalCase extends EvalCase {
  prompt: OpenAIChatMessage[];
}

export interface CompletionEvalCase extends EvalCase {
  prompt: string;
}

export class ChatEvalCase implements EvalCase {
  prompt: OpenAIChatMessage[];
  evalFunctions: EvalFunction[];
  evalResults: EvalResult[] = [];

  constructor(messages: OpenAIChatMessage[], evalFunctions: EvalFunction[] = []) {
    this.prompt = messages;
    this.evalFunctions = evalFunctions;
  }

  addEvalFunction(evalFunction: EvalFunction) {
    this.evalFunctions.push(evalFunction);
  }

  addEvalResults(evalResults: EvalResult[]) {
    this.evalResults.push(...evalResults);
  }
}

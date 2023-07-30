import { Evaluator } from './evaluators';
import { OpenAIChatMessage } from './model';

export interface EvalCase {
  description?: string;
  prompt: string | OpenAIChatMessage[];
  evaluation: Evaluator | Evaluator[];
}

export interface ChatEvalCase extends EvalCase {
  prompt: OpenAIChatMessage[];
}

export interface CompletionEvalCase extends EvalCase {
  prompt: string;
}

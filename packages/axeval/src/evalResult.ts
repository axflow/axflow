import type { EvalCase } from './evalCase';
import type { Evaluator } from './evaluators';

export interface TokenUsage {
  total: number;
  prompt: number;
  completion: number;
  cached?: number;
}

export interface ProviderResponse {
  error?: string;
  output?: string;
  tokenUsage?: Partial<TokenUsage>;
}

export interface EvalResult {
  evalCase: EvalCase;
  evaluator: Evaluator;
  response?: ProviderResponse;
  error?: string;
  success: boolean;
  score: number;
  threshold?: number;
  latencyMs: number;
}

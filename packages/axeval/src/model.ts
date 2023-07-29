import { OpenAIChatCompletionMessageInput } from 'axgen';
import { getEnvOrThrow } from './config';
import { Anthropic, HUMAN_PROMPT, AI_PROMPT } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type ChatModel = {
  run: (messages: OpenAIChatCompletionMessageInput[]) => Promise<string>;
};

export type CompletionModel = {
  name: string;
  run: (prompt: string) => Promise<string>;
};

///////////////
// ANTHROPIC //
///////////////

type SUPPORTED_ANTHROPIC_MODELS = 'claude-1' | 'claude-2';

type AnthropicOptions = {
  max_tokens_to_sample: number;
  temperature: number;
};

const ANTHROPIC_DEFAULTS = Object.freeze({
  max_tokens_to_sample: 300,
  temperature: 0,
});

export class AnthropicCompletion implements CompletionModel {
  name: SUPPORTED_ANTHROPIC_MODELS;
  private client: Anthropic;
  options: AnthropicOptions;

  constructor(model: SUPPORTED_ANTHROPIC_MODELS, options?: Partial<AnthropicOptions>) {
    const anthropic = new Anthropic({
      apiKey: getEnvOrThrow('ANTHROPIC_API_KEY'),
    });
    this.client = anthropic;
    this.name = model;
    this.options = Object.assign({}, ANTHROPIC_DEFAULTS, options);
  }

  async run(prompt: string): Promise<string> {
    const completion: Anthropic.Completion = await this.client.completions.create({
      ...this.options,
      model: this.name,
      prompt: `${HUMAN_PROMPT} ${prompt} ${AI_PROMPT}`,
    });
    return completion.completion;
  }
}
////////////
// OPENAI //
////////////

type SUPPORTED_OPENAI_COMPLETION_MODELS = 'text-davinci-003' | 'text-davinci-002';

export interface OpenAICompletionOptions {
  model: string;
  best_of?: number | null;
  echo?: boolean | null;
  frequency_penalty?: number | null;
  logit_bias?: Record<string, number> | null;
  logprobs?: number | null;
  max_tokens?: number | null;
  n?: number | null;
  presence_penalty?: number | null;
  stop?: string | null | Array<string>;
  suffix?: string | null;
  temperature?: number | null;
  top_p?: number | null;
  user?: string;
}

const DEFAULTS = Object.freeze({
  temperature: 0,
  max_tokens: 400,
  frequency_penalty: 0,
  presence_penalty: 0,
  stop: null,
});

export class OpenAICompletion implements CompletionModel {
  name: SUPPORTED_OPENAI_COMPLETION_MODELS;
  client: OpenAI;
  options: OpenAICompletionOptions;

  constructor(model: SUPPORTED_OPENAI_COMPLETION_MODELS, options?: OpenAICompletionOptions) {
    this.name = model;
    this.client = new OpenAI({
      apiKey: getEnvOrThrow('OPENAI_API_KEY'),
    });
    this.options = Object.assign({}, DEFAULTS, { ...options, model });
  }

  async run(prompt: string): Promise<string> {
    const response = await this.client.completions.create({
      ...this.options,
      prompt,
      stream: false,
    });
    return response.choices[0].text!;
  }
}

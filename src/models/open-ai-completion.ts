import OpenAI from 'openai';
import { getEnvOrThrow } from '../config';
import type { Model } from '../types';

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
  frequency_penalty: 0,
  presence_penalty: 0,
  stop: null,
});

export class OpenAICompletion implements Model {
  private client: OpenAI;
  private options: OpenAICompletionOptions;

  constructor(options: OpenAICompletionOptions) {
    this.client = new OpenAI({
      apiKey: getEnvOrThrow('OPENAI_API_KEY'),
    });
    this.options = Object.assign({}, DEFAULTS, options);
  }

  async run(prompt: string) {
    const response = await this.client.completions.create({
      ...this.options,
      prompt: prompt,
      stream: false,
    });

    return response.choices[0].text!;
  }

  stream(prompt: string) {
    const self = this;

    return {
      async *[Symbol.asyncIterator]() {
        const stream = await self.client.completions.create({
          ...self.options,
          prompt: prompt,
          stream: true,
        });

        for await (const part of stream) {
          yield part.choices[0].text;
        }
      },
    };
  }
}

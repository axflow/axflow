import OpenAI from 'openai';
import { getEnvOrThrow } from '../config';
import type { IModel } from '../types';
import { without } from '../utils';

export interface OpenAIChatCompletionMessageInput {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | null;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIChatCompletionOptions {
  model: string;
  frequency_penalty?: number | null;
  function_call?: 'none' | 'auto' | { name: string };
  functions?: Array<{
    name: string;
    parameters: Record<string, unknown>;
    description?: string;
  }>;
  logit_bias?: Record<string, number> | null;
  max_tokens?: number;
  presence_penalty?: number | null;
  stop?: string | null | Array<string>;
  temperature?: number | null;
  top_p?: number | null;
  user?: string;
}

export namespace OpenAIChatCompletionNoStreaming {
  export interface MessageOutput {
    role: 'system' | 'user' | 'assistant' | 'function';
    content?: string | null;
    function_call?: {
      name?: string;
      arguments?: string;
    };
  }

  export interface Response {
    id: string;
    created: number;
    model: string;
    object: string;
    choices: Array<{
      finish_reason: 'stop' | 'length' | 'function_call';
      index: number;
      message: MessageOutput;
    }>;
    usage?: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    };
  }
}

export namespace OpenAIChatCompletionStreaming {
  export interface Delta {
    role?: 'system' | 'user' | 'assistant' | 'function';
    content?: string | null;
    function_call?: {
      name?: string;
      arguments?: string;
    };
  }

  export interface Response {
    id: string;
    created: number;
    model: string;
    object: string;
    choices: Array<{
      finish_reason: 'stop' | 'length' | 'function_call' | null;
      index: number;
      delta: Delta;
    }>;
  }
}

const DEFAULTS = Object.freeze({
  temperature: 0,
  frequency_penalty: 0,
  presence_penalty: 0,
  stop: null,
});

export class OpenAIChatCompletion
  implements
    IModel<
      OpenAIChatCompletionMessageInput[],
      OpenAIChatCompletionNoStreaming.Response,
      OpenAIChatCompletionStreaming.Response
    >
{
  private client: OpenAI;
  private options: OpenAIChatCompletionOptions;

  constructor(options: OpenAIChatCompletionOptions & { apiKey?: string }) {
    this.client = new OpenAI({
      apiKey: options.apiKey || getEnvOrThrow('OPENAI_API_KEY'),
    });
    this.options = Object.assign({}, DEFAULTS, without(options, 'apiKey'));
  }

  async run(messages: OpenAIChatCompletionMessageInput[]) {
    const response = await this.client.chat.completions.create({
      ...this.options,
      messages: messages,
      stream: false,
    });

    return {
      id: response.id,
      created: response.created,
      model: response.model,
      object: response.object,
      choices: response.choices,
      usage: response.usage,
    };
  }

  stream(messages: OpenAIChatCompletionMessageInput[]) {
    const self = this;

    return {
      async *[Symbol.asyncIterator]() {
        const stream = await self.client.chat.completions.create({
          ...self.options,
          messages: messages,
          stream: true,
        });

        for await (const part of stream) {
          yield {
            id: part.id,
            created: part.created,
            model: part.model,
            object: part.object,
            choices: part.choices,
          };
        }
      },
    };
  }
}

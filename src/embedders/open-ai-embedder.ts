import OpenAI from 'openai';
import { DataEmbedderObject } from '../types';
import { getEnvOrThrow } from '../config';

export const NAME = 'openai' as const;

type Options = {
  model?: string;
};

export class OpenAIEmbedder implements DataEmbedderObject {
  private model: string;
  private client: OpenAI;

  constructor(options?: Options) {
    this.model = options?.model || 'text-embedding-ada-002';
    this.client = new OpenAI({
      apiKey: getEnvOrThrow('OPENAI_API_KEY'),
    });
  }

  async embed(input: string | string[]) {
    const response = await this.client.embeddings.create({
      input: input,
      model: this.model,
    });

    return response.data.map((e) => e.embedding);
  }
}

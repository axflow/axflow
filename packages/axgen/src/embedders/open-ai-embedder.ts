import OpenAI from 'openai';
import { IDataEmbedder } from '../types';
import { getEnvOrThrow } from '../config';

export const NAME = 'openai' as const;

export type OpenAIEmbedderOptions = {
  model?: string;
  apiKey?: string;
};

export class OpenAIEmbedder implements IDataEmbedder {
  private model: string;
  private client: OpenAI;

  constructor(options?: OpenAIEmbedderOptions) {
    this.model = options?.model || 'text-embedding-ada-002';
    this.client = new OpenAI({
      apiKey: options?.apiKey || getEnvOrThrow('OPENAI_API_KEY'),
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

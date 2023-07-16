import { createEmbedding } from '../openai';
import { DataEmbedderObject } from '../types';

export const NAME = 'openai' as const;

type Options = {
  model?: string;
};

export class OpenAIEmbedder implements DataEmbedderObject {
  private model: string;

  constructor(options?: Options) {
    this.model = options?.model || 'text-embedding-ada-002';
  }

  async embed(input: string | string[]) {
    const response = await createEmbedding({
      input: input,
      model: this.model,
    });

    return response.data.map((e) => e.embedding);
  }
}

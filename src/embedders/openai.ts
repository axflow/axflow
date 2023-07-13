import { createEmbedding } from '../openai';
import { DataEmbedderObject, Document } from '../types';

export const NAME = 'openai' as const;

type Options = {
  model?: string;
};

export class OpenAIEmbedder implements DataEmbedderObject {
  private model: string;

  constructor(options?: Options) {
    this.model = options?.model || 'text-embedding-ada-002';
  }

  async embed(chunks: Document[]) {
    const response = await createEmbedding({
      input: chunks.map((chunk) => chunk.text),
      model: this.model,
    });

    return response.data.map((e) => e.embedding);
  }
}

import { getEnvOrThrow } from '../config';
import { wrap, only } from '../utils';

const COHERE_EMBED_URL = 'https://api.cohere.ai/v1/embed';

export const NAME = 'cohere' as const;

export type CohereEmbedderOptions = {
  apiKey?: string;
  model?: string;
  truncate?: 'NONE' | 'START' | 'END';
};

export class CohereEmbedder {
  private readonly apiKey: string;
  private readonly parameters: { model?: string; truncate?: 'NONE' | 'START' | 'END' };

  constructor(options?: CohereEmbedderOptions) {
    options = options || {};
    this.apiKey = options.apiKey || getEnvOrThrow('COHERE_API_KEY');
    this.parameters = only(options, 'model', 'truncate');
  }

  async embed(input: string | string[]) {
    const response = await this.request({
      ...this.parameters,
      texts: wrap(input),
    });

    if (!response.ok) {
      throw new Error(`Response failed with status code ${response.status}`);
    }

    const data = await response.json();

    return data.embeddings;
  }

  private request(params: {
    texts: string[];
    model?: string;
    truncate?: 'NONE' | 'START' | 'END';
  }) {
    return fetch(COHERE_EMBED_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });
  }
}

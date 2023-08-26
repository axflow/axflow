import { POST } from '@axflow/models/utils';
import { headers } from './shared';
import type { SharedRequestOptions } from './shared';

const COHERE_API_URL = 'https://api.cohere.ai/v1/embed';

export namespace CohereEmbeddingTypes {
  export type Request = {
    texts: string[];
    model?: string;
    truncate?: 'NONE' | 'START' | 'END';
  };

  export type RequestOptions = SharedRequestOptions;

  export type Response = {
    id: string;
    embeddings: number[][];
    texts: string[];
    meta: {
      api_version: {
        version: string;
        is_deprecated?: boolean;
        is_experimental?: boolean;
      };
      warnings: string[];
    };
  };
}

async function run(
  request: CohereEmbeddingTypes.Request,
  options: CohereEmbeddingTypes.RequestOptions,
): Promise<CohereEmbeddingTypes.Response> {
  const url = options.apiUrl || COHERE_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey),
    body: JSON.stringify(request),
    fetch: options.fetch,
  });

  return response.json();
}

export class CohereEmbedding {
  static run = run;
}

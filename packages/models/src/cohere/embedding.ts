import { POST } from '@axflow/models/shared';
import { headers } from './shared';
import type { SharedRequestOptions } from './shared';

const COHERE_API_URL = 'https://api.cohere.ai/v1/embed';

export namespace CohereEmbeddingTypes {
  export type Request = {
    texts: string[];
    model?: string;
    truncate?: 'NONE' | 'START' | 'END';
    input_type?: string;
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

/**
 * Calculate text embeddings using the Cohere API.
 *
 * @see https://docs.cohere.com/reference/embed
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/embed for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/embed.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns An object consisting of the text embeddings and other metadata. See Cohere's documentation for /v1/embed.
 */
async function run(
  request: CohereEmbeddingTypes.Request,
  options: CohereEmbeddingTypes.RequestOptions,
): Promise<CohereEmbeddingTypes.Response> {
  const url = options.apiUrl || COHERE_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify(request),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * An object that encapsulates methods for calling the Cohere Embed API.
 */
export class CohereEmbedding {
  static run = run;
}

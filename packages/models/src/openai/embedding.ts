import { POST } from '@axflow/models/shared';
import { headers } from './shared';
import type { SharedRequestOptions } from './shared';

const OPENAI_COMPLETIONS_API_URL = 'https://api.openai.com/v1/embeddings';

export namespace OpenAIEmbeddingTypes {
  export type RequestOptions = SharedRequestOptions;

  // https://platform.openai.com/docs/api-reference/embeddings/create
  export type Request = {
    input: string | Array<string> | Array<number> | Array<Array<number>>;
    model: string;
    user?: string;
  };

  export type EmbeddingObject = {
    index: number;
    object: 'embedding';
    embedding: number[];
  };

  export type Response = {
    object: 'list';
    data: EmbeddingObject[];
    model: string;
    usage: {
      prompt_tokens: number;
      total_tokens: number;
    };
  };
}

/**
 * Calculate text embeddings using the OpenAI API.
 *
 * @see https://platform.openai.com/docs/api-reference/embeddings
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/embeddings for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/embeddings.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns An object consisting of the text embeddings and other metadata. See OpenAI's documentation for /v1/embeddings.
 */
async function run(
  request: OpenAIEmbeddingTypes.Request,
  options: OpenAIEmbeddingTypes.RequestOptions,
): Promise<OpenAIEmbeddingTypes.Response> {
  const url = options.apiUrl || OPENAI_COMPLETIONS_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify(request),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

export class OpenAIEmbedding {
  static run = run;
}

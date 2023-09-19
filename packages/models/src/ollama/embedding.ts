import { POST } from '@axflow/models/shared';
import { OllamaModelOptions } from './shared';

const OLLAMA_EMBEDDING_URL = 'http://127.0.0.1:11434/api/embeddings';

export namespace OllamaEmbeddingTypes {
  export type Request = {
    model: string;
    prompt: string;
    options?: OllamaModelOptions;
  };

  export type RequestOptions = {
    apiUrl?: string;
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  };

  export type Response = {
    // Note: their documentation is wrong, this is purposefully singular.
    embedding: number[];
  };
}

/**
 * Calculate text embeddings using a model served by Ollama.
 *
 * @see https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-embeddings
 *
 * @param request The request body sent to Ollama. It contains the prompt, the model, and some options.
 * @param options
 * @param options.apiUrl The url where the ollama embedding endpoint is served. Defaults to http://127.0.0.1:11434/api/embeddings.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns An object consisting of the text embeddings for the given prompt.
 */
async function run(
  request: OllamaEmbeddingTypes.Request,
  options: OllamaEmbeddingTypes.RequestOptions,
): Promise<OllamaEmbeddingTypes.Response> {
  const url = options.apiUrl || OLLAMA_EMBEDDING_URL;

  const response = await POST(url, {
    headers: options.headers || {},
    body: JSON.stringify(request),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * An object that encapsulates methods for calling the Ollama Embeddings API.
 */
export class OllamaEmbedding {
  static run = run;
}

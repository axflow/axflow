import { POST, HttpError } from '@axflow/models/shared';
import { headers } from './shared';
import type { SharedRequestOptions } from './shared';

const COHERE_API_URL = 'https://api.cohere.ai/v1/generate';

export namespace CohereGenerationTypes {
  export type Request = {
    prompt: string;
    model?: string;
    num_generations?: number;
    max_tokens?: number;
    truncate?: string;
    temperature?: number;
    preset?: string;
    end_sequences?: string[];
    stop_sequences?: string[];
    k?: number;
    p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    return_likelihoods?: string;
    logit_bias?: Record<string, any>;
  };

  export type RequestOptions = SharedRequestOptions;

  export type Generation = {
    id: string;
    text: string;
    index?: number;
    likelihood?: number;
    token_likelihoods?: Array<{
      token: string;
      likelihood: number;
    }>;
  };

  export type Response = {
    id: string;
    prompt?: string;
    generations: Generation[];
    meta: {
      api_version: {
        version: string;
        is_deprecated?: boolean;
        is_experimental?: boolean;
      };
      warnings?: string[];
    };
  };

  export type Chunk = {
    text?: string;
    is_finished: boolean;
    finished_reason?: 'COMPLETE' | 'MAX_TOKENS' | 'ERROR' | 'ERROR_TOXIC';
    response?: {
      id: string;
      prompt?: string;
      generations: Generation[];
    };
  };
}

/**
 * Run a generation against the Cohere API.
 *
 * @see https://docs.cohere.com/reference/generate
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/generate for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/generate.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns Cohere completion. See Cohere's documentation for /v1/generate.
 */
async function run(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions,
): Promise<CohereGenerationTypes.Response> {
  const url = options.apiUrl || COHERE_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * Run a streaming generation against the Cohere API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://docs.cohere.com/reference/generate
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/generate for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/generate.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
async function streamBytes(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || COHERE_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify({ ...request, stream: true }),
    fetch: options.fetch,
    signal: options.signal,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

function noop(chunk: CohereGenerationTypes.Chunk) {
  return chunk;
}

/**
 * Run a streaming generation against the Cohere API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://docs.cohere.com/reference/generate
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/generate for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/generate.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
async function stream(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions,
): Promise<ReadableStream<CohereGenerationTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new CohereGenerationDecoderStream(noop));
}

function chunkToToken(chunk: CohereGenerationTypes.Chunk) {
  return chunk.text || '';
}

/**
 * Run a streaming generation against the Cohere API. The resulting stream emits only the string tokens.
 *
 * @see https://docs.cohere.com/reference/generate
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/generate for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/generate.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
async function streamTokens(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new CohereGenerationDecoderStream(chunkToToken));
}

/**
 * An object that encapsulates methods for calling the Cohere Generate API.
 */
export class CohereGeneration {
  static run = run;
  static stream = stream;
  static streamBytes = streamBytes;
  static streamTokens = streamTokens;
}

class CohereGenerationDecoderStream<T> extends TransformStream<Uint8Array, T> {
  private static parse(line: string): CohereGenerationTypes.Chunk | null {
    line = line.trim();

    // Empty lines are ignored
    if (line.length === 0) {
      return null;
    }

    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(
        `Invalid event: expected well-formed event lines but got ${JSON.stringify(line)}`,
      );
    }
  }

  private static transformer<T>(map: (chunk: CohereGenerationTypes.Chunk) => T) {
    let buffer: string[] = [];
    const decoder = new TextDecoder();

    return (bytes: Uint8Array, controller: TransformStreamDefaultController<T>) => {
      const chunk = decoder.decode(bytes);

      for (let i = 0, len = chunk.length; i < len; ++i) {
        // Cohere separates events with '\n'
        const isEventSeparator = chunk[i] === '\n';

        // Keep buffering unless we've hit the end of an event
        if (!isEventSeparator) {
          buffer.push(chunk[i]);
          continue;
        }

        const event = CohereGenerationDecoderStream.parse(buffer.join(''));

        if (event) {
          controller.enqueue(map(event));
        }

        buffer = [];
      }
    };
  }

  constructor(map: (chunk: CohereGenerationTypes.Chunk) => T) {
    super({ transform: CohereGenerationDecoderStream.transformer(map) });
  }
}

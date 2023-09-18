import { POST, HttpError } from '@axflow/models/shared';
import { headers, streamTransformer } from './shared';
import type { SharedRequestOptions } from './shared';

const OPENAI_COMPLETIONS_API_URL = 'https://api.openai.com/v1/completions';

export namespace OpenAICompletionTypes {
  export type RequestOptions = SharedRequestOptions;

  // https://platform.openai.com/docs/api-reference/completions/create
  export type Request = {
    model: string;
    prompt: string | Array<string> | Array<number> | Array<Array<number>>;
    suffix?: string | null;
    max_tokens?: number | null;
    temperature?: number | null;
    top_p?: number | null;
    n?: number | null;
    logprobs?: number | null;
    echo?: boolean | null;
    stop?: string | null | Array<string>;
    presence_penalty?: number | null;
    frequency_penalty?: number | null;
    best_of?: number | null;
    logit_bias?: Record<string, number> | null;
    user?: string;
  };

  // https://platform.openai.com/docs/api-reference/completions/object
  export type Response = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage?: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    };
  };

  export type Choice = {
    text: string;
    index: number;
    logprobs: {
      text_offset?: Array<number>;
      token_logprobs?: Array<number>;
      tokens?: Array<string>;
      top_logprobs?: Array<Record<string, number>>;
    } | null;
    finish_reason: 'stop' | 'length';
  };

  export type Chunk = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
  };
}

/**
 * Run a completion against the OpenAI API.
 *
 * @see https://platform.openai.com/docs/api-reference/completions
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns OpenAI completion. See OpenAI's documentation for /v1/completions.
 */
async function run(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions,
): Promise<OpenAICompletionTypes.Response> {
  const url = options.apiUrl || OPENAI_COMPLETIONS_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * Run a streaming completion against the OpenAI API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://platform.openai.com/docs/api-reference/completions
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
async function streamBytes(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || OPENAI_COMPLETIONS_API_URL;

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

function noop(chunk: OpenAICompletionTypes.Chunk) {
  return chunk;
}

/**
 * Run a streaming completion against the OpenAI API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://platform.openai.com/docs/api-reference/completions
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
async function stream(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions,
): Promise<ReadableStream<OpenAICompletionTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new OpenAICompletionDecoderStream(noop));
}

function chunkToToken(chunk: OpenAICompletionTypes.Chunk) {
  return chunk.choices[0].text || '';
}

/**
 * Run a streaming completion against the OpenAI API. The resulting stream emits only the string tokens.
 *
 * @see https://platform.openai.com/docs/api-reference/completions
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
async function streamTokens(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new OpenAICompletionDecoderStream(chunkToToken));
}

/**
 * An object that encapsulates methods for calling the OpenAI Completion API.
 */
export class OpenAICompletion {
  static run = run;
  static stream = stream;
  static streamBytes = streamBytes;
  static streamTokens = streamTokens;
}

class OpenAICompletionDecoderStream<T> extends TransformStream<Uint8Array, T> {
  constructor(map: (chunk: OpenAICompletionTypes.Chunk) => T) {
    super({ transform: streamTransformer(map) });
  }
}

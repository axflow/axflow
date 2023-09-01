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

async function run(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions,
): Promise<OpenAICompletionTypes.Response> {
  const url = options.apiUrl || OPENAI_COMPLETIONS_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
  });

  return response.json();
}

async function streamBytes(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || OPENAI_COMPLETIONS_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey),
    body: JSON.stringify({ ...request, stream: true }),
    fetch: options.fetch,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

function noop(chunk: OpenAICompletionTypes.Chunk) {
  return chunk;
}

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

async function streamTokens(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new OpenAICompletionDecoderStream(chunkToToken));
}

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

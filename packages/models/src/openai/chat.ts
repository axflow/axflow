import { POST, HttpError } from '@axflow/models/shared';
import { headers, streamTransformer } from './shared';
import type { SharedRequestOptions } from './shared';

const OPENAI_CHAT_COMPLETIONS_API_URL = 'https://api.openai.com/v1/chat/completions';

export namespace OpenAIChatTypes {
  export type RequestOptions = SharedRequestOptions;

  export type Function = {
    name: string;
    parameters: Record<string, unknown>;
    description?: string;
  };
  // https://platform.openai.com/docs/api-reference/chat/create
  export type Request = {
    model: string;
    messages: Message[];
    functions?: Array<Function>;
    tools?: Array<{
      type: 'function';
      function: Function;
    }>;
    tool_choice?: 'none' | 'auto' | { type: 'function'; name: string };
    function_call?: 'none' | 'auto' | { name: string };
    response_format?: { type: 'text' | 'json_object' };
    seed?: number | null;
    temperature?: number | null;
    top_p?: number | null;
    n?: number | null;
    stop?: string | null | Array<string>;
    max_tokens?: number;
    presence_penalty?: number | null;
    frequency_penalty?: number | null;
    logit_bias?: Record<string, number> | null;
    user?: string;
    logprobs?: boolean | null;
    top_logprobs?: number | null;
  };

  export type SystemMessage = {
    role: 'system';
    name?: string;
    content: string | null;
  };

  export type UserMessage = {
    role: 'user';
    name?: string;
    content: string | null;
  };

  export type AssistantMessage = {
    role: 'assistant';
    name?: string;
    content?: string | null;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }>;
    function_call?: {
      name: string;
      arguments: string;
    };
  };

  export type ToolMessage = {
    role: 'tool';
    name?: string;
    content: string | null;
    tool_call_id: string;
  };

  // Deprecated
  export type FunctionMessage = {
    role: 'function';
    name: string;
    content: string | null;
  };

  export type Message =
    | SystemMessage
    | UserMessage
    | AssistantMessage
    | ToolMessage
    | FunctionMessage;

  // https://platform.openai.com/docs/api-reference/chat/object
  export type Response = {
    id: string;
    object: string;
    created: number;
    model: string;
    system_fingerprint: string;
    choices: Array<{
      index: number;
      finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter' | 'tool_calls' | null;
      message: Message;
      logprobs: { content: any[] | null } | null;
    }>;
    usage?: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    };
  };

  // https://platform.openai.com/docs/api-reference/chat/streaming
  export type Chunk = {
    id: string;
    object: string;
    created: number;
    model: string;
    system_fingerprint: string;
    choices: Array<{
      index: number;
      delta: Delta;
      finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter' | 'tool_calls' | null;
      logprobs: { content: any[] | null } | null;
    }>;
  };

  export type Delta = {
    role?: 'system' | 'user' | 'assistant' | 'function';
    content?: string | null;
    function_call?: {
      name?: string;
      arguments?: string;
    };
    tool_calls?: Array<{
      id?: string;
      index: number;
      type?: 'function';
      function: { name?: string; arguments: string };
    }>;
  };
}

/**
 * Run a chat completion against the OpenAI API.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/chat/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/chat/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns OpenAI chat completion. See OpenAI's documentation for /v1/chat/completions.
 */
async function run(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions,
): Promise<OpenAIChatTypes.Response> {
  const url = options.apiUrl || OPENAI_CHAT_COMPLETIONS_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * Run a streaming chat completion against the OpenAI API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/chat/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/chat/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
async function streamBytes(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || OPENAI_CHAT_COMPLETIONS_API_URL;

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

function noop(chunk: OpenAIChatTypes.Chunk) {
  return chunk;
}

/**
 * Run a streaming chat completion against the OpenAI API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/chat/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/chat/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
async function stream(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions,
): Promise<ReadableStream<OpenAIChatTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new OpenAIChatDecoderStream(noop));
}

function chunkToToken(chunk: OpenAIChatTypes.Chunk) {
  return chunk.choices[0].delta.content || '';
}

/**
 * Run a streaming chat completion against the OpenAI API. The resulting stream emits only the string tokens.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/chat/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/chat/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
async function streamTokens(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new OpenAIChatDecoderStream(chunkToToken));
}

/**
 * An object that encapsulates methods for calling the OpenAI Chat Completion API.
 */
export class OpenAIChat {
  static run = run;
  static stream = stream;
  static streamBytes = streamBytes;
  static streamTokens = streamTokens;
}

class OpenAIChatDecoderStream<T> extends TransformStream<Uint8Array, T> {
  constructor(map: (chunk: OpenAIChatTypes.Chunk) => T) {
    super({ transform: streamTransformer(map) });
  }
}

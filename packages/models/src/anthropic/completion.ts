import { POST, HttpError } from '@axflow/models/shared';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/complete';

export namespace AnthropicCompletionTypes {
  export type Request = {
    model: string;
    prompt: string;
    max_tokens_to_sample: number;
    stop_sequences?: string[];
    temperature?: number;
    top_p?: number;
    top_k?: number;
    metadata?: Record<any, string>;
  };

  export type RequestOptions = {
    apiKey?: string;
    apiUrl?: string;
    version?: string;
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  };

  type Completion = {
    model: string;
    completion: string;
    stop_reason: string | null;
    stop: string | null;
    log_id: string;
  };

  export type Response = Completion;

  // https://docs.anthropic.com/claude/reference/streaming
  export type CompletionEvent = {
    event: 'completion';
    data: Completion;
  };

  export type PingEvent = {
    event: 'ping';
    data: {};
  };

  export type ErrorEvent = {
    event: 'error';
    data: { error: { type: string; message: string } };
  };

  export type Chunk = CompletionEvent | PingEvent | ErrorEvent;

  export type Events = 'completion' | 'ping' | 'error';
}

function headers(apiKey?: string, version?: string, customHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    ...customHeaders,
    'anthropic-version': version || '2023-06-01',
  };

  if (typeof apiKey === 'string') {
    headers['x-api-key'] = apiKey;
  }

  return headers;
}

/**
 * Run a completion against the Anthropic API.
 *
 * @see https://docs.anthropic.com/claude/reference/complete_post
 *
 * @param request The request body sent to Anthropic. See Anthropic's documentation for /v1/complete for supported parameters.
 * @param options
 * @param options.apiKey Anthropic API key.
 * @param options.apiUrl The url of the Anthropic (or compatible) API. Defaults to https://api.anthropic.com/v1/complete.
 * @param options.version The Anthropic API version. Defaults to 2023-06-01. Note that older versions are not currently supported.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns Anthropic completion. See Anthropic's documentation for /v1/complete.
 */
async function run(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions,
): Promise<AnthropicCompletionTypes.Response> {
  const url = options.apiUrl || ANTHROPIC_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.version, options.headers),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * Run a streaming completion against the Anthropic API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://docs.anthropic.com/claude/reference/complete_post
 * @see https://docs.anthropic.com/claude/reference/streaming
 *
 * @param request The request body sent to Anthropic. See Anthropic's documentation for /v1/complete for supported parameters.
 * @param options
 * @param options.apiKey Anthropic API key.
 * @param options.apiUrl The url of the Anthropic (or compatible) API. Defaults to https://api.anthropic.com/v1/complete.
 * @param options.version The Anthropic API version. Defaults to 2023-06-01. Note that older versions are not currently supported.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
async function streamBytes(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || ANTHROPIC_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.version, options.headers),
    body: JSON.stringify({ ...request, stream: true }),
    fetch: options.fetch,
    signal: options.signal,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

function noop(chunk: AnthropicCompletionTypes.Chunk) {
  return chunk;
}

/**
 * Run a streaming completion against the Anthropic API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://docs.anthropic.com/claude/reference/complete_post
 * @see https://docs.anthropic.com/claude/reference/streaming
 *
 * @param request The request body sent to Anthropic. See Anthropic's documentation for /v1/complete for supported parameters.
 * @param options
 * @param options.apiKey Anthropic API key.
 * @param options.apiUrl The url of the Anthropic (or compatible) API. Defaults to https://api.anthropic.com/v1/complete.
 * @param options.version The Anthropic API version. Defaults to 2023-06-01. Note that older versions are not currently supported.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
async function stream(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions,
): Promise<ReadableStream<AnthropicCompletionTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new AnthropicCompletionDecoderStream(noop));
}

function chunkToToken(chunk: AnthropicCompletionTypes.Chunk): string {
  return chunk.event === 'completion' ? chunk.data.completion : '';
}

/**
 * Run a streaming completion against the Anthropic API. The resulting stream emits only the string tokens.
 *
 * @see https://docs.anthropic.com/claude/reference/complete_post
 * @see https://docs.anthropic.com/claude/reference/streaming
 *
 * @param request The request body sent to Anthropic. See Anthropic's documentation for /v1/complete for supported parameters.
 * @param options
 * @param options.apiKey Anthropic API key.
 * @param options.apiUrl The url of the Anthropic (or compatible) API. Defaults to https://api.anthropic.com/v1/complete.
 * @param options.version The Anthropic API version. Defaults to 2023-06-01. Note that older versions are not currently supported.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
async function streamTokens(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new AnthropicCompletionDecoderStream(chunkToToken));
}

/**
 * An object that encapsulates methods for calling the Anthropic Completion API.
 */
export class AnthropicCompletion {
  static run = run;
  static stream = stream;
  static streamBytes = streamBytes;
  static streamTokens = streamTokens;
}

/**
 * Decodes streaming events from Anthropic.
 *
 * @see https://docs.anthropic.com/claude/reference/streaming
 */
class AnthropicCompletionDecoderStream<T> extends TransformStream<Uint8Array, T> {
  private static EVENT_LINES_RE = /^event:\s*(\w+)\r\ndata:\s*(.+)$/;

  private static parse(lines: string): AnthropicCompletionTypes.Chunk | null {
    lines = lines.trim();

    // Empty lines are ignored
    if (lines.length === 0) {
      return null;
    }

    const match = lines.match(AnthropicCompletionDecoderStream.EVENT_LINES_RE);

    try {
      const event = match![1];
      const data = match![2];

      return {
        event: event as AnthropicCompletionTypes.Events,
        data: JSON.parse(data),
      };
    } catch (error) {
      throw new Error(`Expected well-formed streaming events but got ${JSON.stringify(lines)}`);
    }
  }

  private static transformer<T>(map: (chunk: AnthropicCompletionTypes.Chunk) => T) {
    let buffer: string[] = [];
    const decoder = new TextDecoder();

    return (bytes: Uint8Array, controller: TransformStreamDefaultController<T>) => {
      const chunk = decoder.decode(bytes);

      for (let i = 0, len = chunk.length; i < len; ++i) {
        const bufferLen = buffer.length;

        // Anthropic separates events with '\r\n\r\n'
        const isEventSeparator =
          chunk[i] === '\n' &&
          buffer[bufferLen - 3] === '\r' &&
          buffer[bufferLen - 2] === '\n' &&
          buffer[bufferLen - 1] === '\r';

        // Keep buffering unless we've hit the end of an event
        if (!isEventSeparator) {
          buffer.push(chunk[i]);
          continue;
        }

        const event = AnthropicCompletionDecoderStream.parse(buffer.join(''));

        // Error the stream if we encounter an error from Anthropic
        if (event && event.event === 'error') {
          const error = event.data.error;
          controller.error(`${error.type}: ${error.message}`);
        } else if (event) {
          controller.enqueue(map(event));
        }

        buffer = [];
      }
    };
  }

  constructor(map: (chunk: AnthropicCompletionTypes.Chunk) => T) {
    super({ transform: AnthropicCompletionDecoderStream.transformer(map) });
  }
}

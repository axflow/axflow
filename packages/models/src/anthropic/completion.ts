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

function headers(apiKey?: string, version?: string) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'anthropic-version': version || '2023-06-01',
  };

  if (typeof apiKey === 'string') {
    headers['x-api-key'] = apiKey;
  }

  return headers;
}

async function run(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions,
): Promise<AnthropicCompletionTypes.Response> {
  const url = options.apiUrl || ANTHROPIC_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.version),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
  });

  return response.json();
}

async function streamBytes(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || ANTHROPIC_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.version),
    body: JSON.stringify({ ...request, stream: true }),
    fetch: options.fetch,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

function noop(chunk: AnthropicCompletionTypes.Chunk) {
  return chunk;
}

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

async function streamTokens(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new AnthropicCompletionDecoderStream(chunkToToken));
}

export class AnthropicCompletion {
  static run = run;
  static stream = stream;
  static streamBytes = streamBytes;
  static streamTokens = streamTokens;
}

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

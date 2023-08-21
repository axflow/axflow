import { POST, HttpError } from '@axflow/models/utils';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/complete';

export namespace AnthropicTypes {
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
    apiKey: string;
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

function headers(apiKey: string, version?: string) {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    'anthropic-version': version || '2023-06-01',
    'x-api-key': apiKey,
  };
}

export async function run(
  request: AnthropicTypes.Request,
  options: AnthropicTypes.RequestOptions,
): Promise<AnthropicTypes.Response> {
  const url = options.apiUrl || ANTHROPIC_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.version),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
  });

  return response.json();
}

export async function streamBytes(
  request: AnthropicTypes.Request,
  options: AnthropicTypes.RequestOptions,
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

export async function stream(
  request: AnthropicTypes.Request,
  options: AnthropicTypes.RequestOptions,
): Promise<ReadableStream<AnthropicTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);

  return byteStream
    .pipeThrough(new TextDecoderStream()) // Raw bytes  => JS strings
    .pipeThrough(new EventDecoderStream()); // JS strings => AnthropicTypes.Chunk objects
}

export class AnthropicCompletion {
  static run = run;
  static stream = stream;
  static streamBytes = streamBytes;
}

class EventDecoderStream extends TransformStream<string, AnthropicTypes.Chunk> {
  private static EVENT_LINES_RE = /^event:\s*(\w+)\r\ndata:\s*(.+)$/;

  private static parse(lines: string): AnthropicTypes.Chunk | null {
    lines = lines.trim();

    // Empty lines are ignored
    if (lines.length === 0) {
      return null;
    }

    const match = lines.match(EventDecoderStream.EVENT_LINES_RE);

    try {
      const event = match![1];
      const data = match![2];

      return {
        event: event as AnthropicTypes.Events,
        data: JSON.parse(data),
      };
    } catch (error) {
      throw new Error(`Expected well-formed streaming events but got ${JSON.stringify(lines)}`);
    }
  }

  private static transformer() {
    let buffer: string[] = [];

    return (chunk: string, controller: TransformStreamDefaultController) => {
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

        const event = EventDecoderStream.parse(buffer.join(''));

        if (event) {
          controller.enqueue(event);
        }

        buffer = [];
      }
    };
  }

  constructor() {
    super({ transform: EventDecoderStream.transformer() });
  }
}

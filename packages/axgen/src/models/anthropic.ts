import { getEnvOrThrow } from '../config';
import type { IModel } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/complete';

const DEFAULT_PARAMETERS = {
  model: 'claude-2',
  max_tokens_to_sample: 256,
};

export namespace AnthropicTypes {
  export type Parameters = {
    model: string;
    prompt: string;
    max_tokens_to_sample: number;
    stream?: boolean;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    metadata?: Record<any, string>;
  };

  export type Options = {
    apiKey?: string;
    version?: string;
    parameters?: Partial<Parameters>;
  };

  export type Completion = {
    completion: string;
    stop_reason: string | null;
    stop: string | null;
    model: string;
    log_id: string;
  };

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

  export type Event = CompletionEvent | PingEvent | ErrorEvent;

  export type Events = 'completion' | 'ping' | 'error';
}

export class Anthropic implements IModel<string, AnthropicTypes.Completion, AnthropicTypes.Event> {
  private readonly apiKey: string;
  private readonly version: string;
  private readonly parameters: Partial<AnthropicTypes.Parameters>;

  constructor(options?: AnthropicTypes.Options) {
    options = options || {};
    this.apiKey = options.apiKey || getEnvOrThrow('ANTHROPIC_API_KEY');
    this.version = options.version || '2023-06-01';
    this.parameters = options.parameters || {};
  }

  async run(prompt: string): Promise<AnthropicTypes.Completion> {
    const params = {
      ...DEFAULT_PARAMETERS,
      ...this.parameters,
      prompt: prompt,
      stream: false,
    };

    const response = await this.request(params);

    return response.json();
  }

  stream(prompt: string) {
    const params = {
      ...DEFAULT_PARAMETERS,
      ...this.parameters,
      prompt: prompt,
      stream: true,
    };

    const request = this.request.bind(this);

    return {
      async *[Symbol.asyncIterator]() {
        const response = await request(params);

        if (!response.ok || !response.body) {
          throw new Error(`Request failed with status code ${response.status}`);
        }

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new EventDecoderStream())
          .getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            yield value;
          }
        } finally {
          reader.releaseLock();
        }
      },
    };
  }

  private request(params: AnthropicTypes.Parameters) {
    return fetch(ANTHROPIC_API_URL, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'anthropic-version': this.version,
        'x-api-key': this.apiKey,
      },
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

class EventDecoderStream extends TransformStream<string, AnthropicTypes.Event> {
  private static EVENT_LINES_RE = /^event:\s*(\w+)\r\ndata:\s*(.+)$/;

  private static parse(lines: string): AnthropicTypes.Event | null {
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
      throw new Error(
        `Invalid event: expected well-formed event lines but got ${JSON.stringify(lines)}`
      );
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

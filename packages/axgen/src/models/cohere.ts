import { getEnvOrThrow } from '../config';
import type { IModel } from '../types';

const COHERE_API_URL = 'https://api.cohere.ai/v1/generate';

const DEFAULT_PARAMETERS = {
  max_tokens: 256,
};

export namespace CohereTypes {
  export type Parameters = {
    prompt: string;
    model?: string;
    num_generations?: number;
    stream?: boolean;
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

  export type Options = {
    apiKey?: string;
    parameters?: Partial<Parameters>;
  };

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

  export type Event = {
    text: string;
    is_finished: boolean;
    finished_reason?: 'COMPLETE' | 'MAX_TOKENS' | 'ERROR' | 'ERROR_TOXIC';
    response?: {
      id: string;
      prompt?: string;
      generations: Generation[];
    };
  };
}

export class Cohere implements IModel<string, CohereTypes.Response, CohereTypes.Event> {
  private readonly apiKey: string;
  private readonly parameters: Partial<CohereTypes.Parameters>;

  constructor(options?: CohereTypes.Options) {
    options = options || {};
    this.apiKey = options.apiKey || getEnvOrThrow('COHERE_API_KEY');
    this.parameters = options.parameters || {};
  }

  async run(prompt: string): Promise<CohereTypes.Response> {
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

  private request(params: CohereTypes.Parameters) {
    return fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });
  }
}

class EventDecoderStream extends TransformStream<string, CohereTypes.Event> {
  private static parse(line: string): CohereTypes.Event | null {
    line = line.trim();

    // Empty lines are ignored
    if (line.length === 0) {
      return null;
    }

    try {
      const event: CohereTypes.Event = JSON.parse(line);

      // The last event doesn't include this, but this makes the type system more pleasant.
      if (typeof event.text !== 'string') {
        event.text = '';
      }

      return event;
    } catch (error) {
      throw new Error(
        `Invalid event: expected well-formed event lines but got ${JSON.stringify(line)}`
      );
    }
  }

  private static transformer() {
    let buffer: string[] = [];

    return (chunk: string, controller: TransformStreamDefaultController) => {
      for (let i = 0, len = chunk.length; i < len; ++i) {
        // Cohere separates events with '\n'
        const isEventSeparator = chunk[i] === '\n';

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

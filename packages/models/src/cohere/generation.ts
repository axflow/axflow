import { POST, HttpError } from '@axflow/models/utils';
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

export async function run(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions,
): Promise<CohereGenerationTypes.Response> {
  const url = options.apiUrl || COHERE_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
  });

  return response.json();
}

export async function streamBytes(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || COHERE_API_URL;

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

export async function stream(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions,
): Promise<ReadableStream<CohereGenerationTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);

  return byteStream
    .pipeThrough(new TextDecoderStream()) // Raw bytes  => JS strings
    .pipeThrough(new EventDecoderStream()); // JS strings => CohereGenerationTypes.Chunk objects
}

export class CohereGeneration {
  static run = run;
  static stream = stream;
  static streamBytes = streamBytes;
}

class EventDecoderStream extends TransformStream<string, CohereGenerationTypes.Chunk> {
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

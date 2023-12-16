import { HttpError, POST } from '@axflow/models/shared';

const TOGETHERAI_INFERENCE_ENDPOINT = 'https://api.together.xyz/inference';

export namespace TogetherAIInferenceTypes {
  export type RequestOptions = {
    apiKey?: string;
    apiUrl?: string;
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  };

  export type Request = {
    model: string;
    prompt: string;
    max_tokens: number;
    stop?: string[];
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repetition_penalty?: number;
    logprobs?: number;
    safety_model?: string;
  };

  export type Response = {
    id: string;
    status: string;
    prompt: string[];
    model: string;
    model_owner: string;
    tags?: Record<string, any>;
    num_returns: number;
    args: {
      model: string;
      prompt: string;
      max_tokens: number;
      stream: boolean;
      temperature?: number;
      top_p?: number;
      top_k?: number;
    };
    subjobs: any[];
    output: {
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      result_type: string;
      raw_compute_time?: number;
      choices: Array<{
        text: string;
        index?: number;
        finish_reason?: string;
      }>;
    };
  };

  export type Chunk = {
    id: string;
    choices: Array<{
      text: string;
    }>;
    generated_text?: string;
    token: { id: number; text: string; logprob: number; special: boolean };
    stats: null | {
      total_time: { secs: number; nanos: number };
      validation_time: { secs: number; nanos: number };
      queue_time: { secs: number; nanos: number };
      inference_time: { secs: number; nanos: number };
      time_per_token: { secs: number; nanos: number };
    };
    usage: null | {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

function headers(apiKey?: string, customHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    ...customHeaders,
  };

  if (typeof apiKey === 'string') {
    headers.authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

/**
 * Run a prediction request against TogetherAI's inference API.
 *
 * @see https://docs.together.ai/reference/inference
 *
 * @param request The request body sent to TogetherAI. See https://docs.together.ai/reference/inference.
 * @param options
 * @param options.apiKey TogetherAI API key.
 * @param options.apiUrl The url of the TogetherAI (or compatible) API. Defaults to https://api.together.xyz/inference.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns TogetherAI inference response. See https://docs.together.ai/reference/inference.
 */
async function run(
  request: TogetherAIInferenceTypes.Request,
  options: TogetherAIInferenceTypes.RequestOptions,
): Promise<TogetherAIInferenceTypes.Response> {
  const url = options.apiUrl || TOGETHERAI_INFERENCE_ENDPOINT;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify({ ...request, stream_tokens: false }),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * Run a streaming prediction request against TogetherAI's inference API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://docs.together.ai/reference/inference
 *
 * @param request The request body sent to TogetherAI. See https://docs.together.ai/reference/inference.
 * @param options
 * @param options.apiKey TogetherAI API key.
 * @param options.apiUrl The url of the TogetherAI (or compatible) API. Defaults to https://api.together.xyz/inference.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
async function streamBytes(
  request: TogetherAIInferenceTypes.Request,
  options: TogetherAIInferenceTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || TOGETHERAI_INFERENCE_ENDPOINT;

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify({ ...request, stream_tokens: true }),
    fetch: options.fetch,
    signal: options.signal,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

function noop(chunk: TogetherAIInferenceTypes.Chunk) {
  return chunk;
}

/**
 * Run a streaming prediction request against TogetherAI's inference API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://docs.together.ai/reference/inference
 *
 * @param request The request body sent to TogetherAI. See https://docs.together.ai/reference/inference.
 * @param options
 * @param options.apiKey TogetherAI API key.
 * @param options.apiUrl The url of the TogetherAI (or compatible) API. Defaults to https://api.together.xyz/inference.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
async function stream(
  request: TogetherAIInferenceTypes.Request,
  options: TogetherAIInferenceTypes.RequestOptions,
): Promise<ReadableStream<TogetherAIInferenceTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new TogetherAIInferenceDecoderStream(noop));
}

function chunkToToken(chunk: TogetherAIInferenceTypes.Chunk) {
  return chunk.choices[0].text || '';
}

/**
 * Run a streaming prediction request against TogetherAI's inference API. The resulting stream emits only the string tokens.
 *
 * @see https://docs.together.ai/reference/inference
 *
 * @param request The request body sent to TogetherAI. See https://docs.together.ai/reference/inference.
 * @param options
 * @param options.apiKey TogetherAI API key.
 * @param options.apiUrl The url of the TogetherAI (or compatible) API. Defaults to https://api.together.xyz/inference.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
async function streamTokens(
  request: TogetherAIInferenceTypes.Request,
  options: TogetherAIInferenceTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new TogetherAIInferenceDecoderStream(chunkToToken));
}

/**
 * An object that encapsulates methods for calling the TogetherAI inference API.
 */
export class TogetherAIInference {
  static run = run;
  static stream = stream;
  static streamBytes = streamBytes;
  static streamTokens = streamTokens;
}

class TogetherAIInferenceDecoderStream<T> extends TransformStream<Uint8Array, T> {
  static DATA_RE = /data:\s*(.+)/;

  static parseChunk<T>(chunk: string): T | null {
    chunk = chunk.trim();

    if (chunk.length === 0) {
      return null;
    }

    const match = chunk.match(TogetherAIInferenceDecoderStream.DATA_RE);

    try {
      const data = match![1];
      return data === '[DONE]' ? null : JSON.parse(data);
    } catch (error) {
      throw new Error(
        `Encountered unexpected chunk while parsing TogetherAI streaming response: ${JSON.stringify(
          chunk,
        )}`,
      );
    }
  }

  static streamTransformer<InputChunk, OutputChunk>(map: (chunk: InputChunk) => OutputChunk) {
    let buffer: string[] = [];
    const decoder = new TextDecoder();

    return (bytes: Uint8Array, controller: TransformStreamDefaultController<OutputChunk>) => {
      const chunk = decoder.decode(bytes);

      for (let i = 0, len = chunk.length; i < len; ++i) {
        // Events separated by '\n\n'
        const isChunkSeparator = chunk[i] === '\n' && buffer[buffer.length - 1] === '\n';

        // Keep buffering unless we've hit the end of a data chunk
        if (!isChunkSeparator) {
          buffer.push(chunk[i]);
          continue;
        }

        const parsedChunk = TogetherAIInferenceDecoderStream.parseChunk<InputChunk>(
          buffer.join(''),
        );

        if (parsedChunk) {
          controller.enqueue(map(parsedChunk));
        }

        buffer = [];
      }
    };
  }

  constructor(map: (chunk: TogetherAIInferenceTypes.Chunk) => T) {
    super({ transform: TogetherAIInferenceDecoderStream.streamTransformer(map) });
  }
}

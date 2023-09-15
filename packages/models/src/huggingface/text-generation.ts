import { HttpError, isHttpError, POST } from '@axflow/models/shared';

// HuggingFace has the concept of a task. This code supports the "textGeneration" task.
// https://huggingface.co/models?pipeline_tag=text-generation

// https://huggingface.co/docs/api-inference/quicktour#running-inference-with-api-requests
const HUGGING_FACE_MODEL_API_URL = 'https://api-inference.huggingface.co/models/';
const HUGGING_FACE_STOP_TOKEN = '</s>';

function headers(apiKey?: string, customHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    ...customHeaders,
    'content-type': 'application/json',
  };
  if (typeof apiKey === 'string') {
    headers.authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

export namespace HuggingFaceTextGenerationTypes {
  // https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
  export type Request = {
    model: string;
    inputs: string;
    parameters?: {
      top_k?: number;
      top_p?: number;
      temperature?: number;
      repetition_penalty?: number;
      max_new_tokens?: number;
      // In seconds
      max_time?: number;
      return_full_text?: boolean;
      num_return_sequences?: number;
      do_sample?: boolean;
    };
    options?: {
      use_cache?: boolean;
      wait_for_model?: boolean;
    };
  };

  export type RequestOptions = {
    apiKey?: string;
    apiUrl?: string;
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  };

  export type GeneratedText = {
    generated_text: string;
  };

  // https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
  export type Response = GeneratedText | GeneratedText[];

  // Best documentation available: https://huggingface.co/docs/huggingface_hub/main/en/package_reference/inference_client#huggingface_hub.inference._text_generation.TextGenerationStreamResponse
  export type Chunk = {
    token: {
      id: number;
      text: string;
      logprob: number;
      special: boolean;
    };
    generated_text: string;
    details?: {
      // https://github.com/huggingface/huggingface_hub/blob/49cbeb78d3d87b22a40d04ef8a733855e82d17ef/src/huggingface_hub/inference/_text_generation.py#L272
      finishReason: string;
      generated_tokens: number;
      seed?: number;
    };
  };
}

/**
 * Run a textGeneration task against the HF inference API
 *
 * @see https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
 *
 * @param request The request body sent to HF. See their documentation linked above for details
 * @param options
 * @param options.apiKey The HuggingFace access token. If not provided, requests will be throttled
 * @param options.apiUrl The HuggingFace API URL. Defaults to https://api-inference.huggingface.co/models/
 * @param options.fetch The fetch implementation to use. Defaults to globalThis.fetch
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns The response body from HF. See their documentation linked above for details
 */
async function run(
  request: HuggingFaceTextGenerationTypes.Request,
  options: HuggingFaceTextGenerationTypes.RequestOptions,
): Promise<HuggingFaceTextGenerationTypes.Response> {
  const url = options.apiUrl || HUGGING_FACE_MODEL_API_URL + request.model;

  const headers_ = headers(options.apiKey, options.headers);
  const body = JSON.stringify({ ...request, stream: false });
  const response = await POST(url, {
    headers: headers_,
    body,
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * Stream a textGeneration task against the HF inference API. The resulting stream is the raw unmodified bytes from the API
 *
 * @see https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
 *
 * @param request The request body sent to HF. See their documentation linked above for details
 * @param options
 * @param options.apiKey The HuggingFace access token. If not provided, requests will be throttled
 * @param options.apiUrl The HuggingFace API URL. Defaults to https://api-inference.huggingface.co/models/
 * @param options.fetch The fetch implementation to use. Defaults to globalThis.fetch
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
async function streamBytes(
  request: HuggingFaceTextGenerationTypes.Request,
  options: HuggingFaceTextGenerationTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || HUGGING_FACE_MODEL_API_URL + request.model;

  const headers_ = headers(options.apiKey, options.headers);
  const body = JSON.stringify({ ...request, stream: true });
  try {
    const response = await POST(url, {
      headers: headers_,
      body,
      fetch: options.fetch,
      signal: options.signal,
    });

    if (!response.body) {
      throw new HttpError('Expected response body to be a ReadableStream', response);
    }

    return response.body;
  } catch (e) {
    if (isHttpError(e)) {
      try {
        const body = await e.response.json();
        if (body?.error[0]?.includes('`stream` is not supported for this model')) {
          throw new HttpError(`Model '${request.model}' does not support streaming`, e.response);
        }
      } catch {
        // Cannot parse the response body into JSON, so throw the original error
        throw e;
      }
    }
    throw e;
  }
}

function noop(chunk: HuggingFaceTextGenerationTypes.Chunk) {
  return chunk;
}

/*
 * Return the text from a chunk. If the chunk is a stop token, don't return it to the user.
 * Example chunk:
 *   {
 *     token: { id: 11, text: ' and', logprob: -0.00002193451, special: false },
 *     generated_text: null,
 *     details: null
 *   }
 */
function chunkToToken(chunk: HuggingFaceTextGenerationTypes.Chunk) {
  if (chunk.token.special && chunk.token.text.includes(HUGGING_FACE_STOP_TOKEN)) {
    return '';
  }
  return chunk.token.text;
}

/**
 * Stream a textGeneration task against the HF inference API. The resulting stream is the parsed stream data as JavaScript objects.
 * Example chunk:
 *   {
 *     token: { id: 11, text: ' and', logprob: -0.00002193451, special: false },
 *     generated_text: null,
 *     details: null
 *   }
 *
 * @see https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
 *
 * @param request The request body sent to HF. See their documentation linked above for details
 * @param options
 * @param options.apiKey The HuggingFace access token. If not provided, requests will be throttled
 * @param options.apiUrl The HuggingFace API URL. Defaults to https://api-inference.huggingface.co/models/
 * @param options.fetch The fetch implementation to use. Defaults to globalThis.fetch
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API
 */
async function stream(
  request: HuggingFaceTextGenerationTypes.Request,
  options: HuggingFaceTextGenerationTypes.RequestOptions,
): Promise<ReadableStream<HuggingFaceTextGenerationTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new HuggingFaceDecoderStream(noop));
}

/**
 * Run a streaming completion against the HF inference API. The resulting stream emits only the string tokens.
 * Note that this will strip the STOP token '</s>' from the text.
 *
 * @see https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
 *
 * @param request The request body sent to HF. See their documentation linked above for details
 * @param options
 * @param options.apiKey The HuggingFace access token. If not provided, requests will be throttled
 * @param options.apiUrl The HuggingFace API URL. Defaults to https://api-inference.huggingface.co/models/
 * @param options.fetch The fetch implementation to use. Defaults to globalThis.fetch
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
async function streamTokens(
  request: HuggingFaceTextGenerationTypes.Request,
  options: HuggingFaceTextGenerationTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new HuggingFaceDecoderStream(chunkToToken));
}

/**
 * An object that encapsulates methods for calling the HF inference API
 */
export class HuggingFaceTextGeneration {
  static run = run;
  static streamBytes = streamBytes;
  static stream = stream;
  static streamTokens = streamTokens;
}

class HuggingFaceDecoderStream<T> extends TransformStream<Uint8Array, T> {
  private static LINES_RE = /data:\s*(.+)/;

  private static parseChunk(lines: string): HuggingFaceTextGenerationTypes.Chunk | null {
    lines = lines.trim();

    // Empty lines are ignored
    if (lines.length === 0) {
      return null;
    }

    const match = lines.match(HuggingFaceDecoderStream.LINES_RE);

    try {
      const data = match![1];
      return JSON.parse(data);
    } catch (e) {
      throw new Error(`Malformed streaming data from HuggingFace: ${JSON.stringify(lines)}`);
    }
  }

  private static transformer<T>(map: (chunk: HuggingFaceTextGenerationTypes.Chunk) => T) {
    let buffer: string[] = [];
    const decoder = new TextDecoder();

    return (bytes: Uint8Array, controller: TransformStreamDefaultController<T>) => {
      const chunk = decoder.decode(bytes);

      for (let i = 0, len = chunk.length; i < len; ++i) {
        const bufferLength = buffer.length;
        // HF streams separator is `\n\n` (at least with the currently tested model)
        const isSeparator = chunk[i] === '\n' && buffer[bufferLength - 1] === '\n';

        // Keep buffering unless we've hit the end of a data chunk
        if (!isSeparator) {
          buffer.push(chunk[i]);
          continue;
        }

        // Decode the object into the expected JSON type
        const parsedChunk = HuggingFaceDecoderStream.parseChunk(buffer.join(''));
        if (parsedChunk) {
          controller.enqueue(map(parsedChunk));
        }

        buffer = [];
      }
    };
  }

  constructor(map: (chunk: HuggingFaceTextGenerationTypes.Chunk) => T) {
    super({ transform: HuggingFaceDecoderStream.transformer(map) });
  }
}

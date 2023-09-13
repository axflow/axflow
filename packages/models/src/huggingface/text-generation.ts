import { HttpError, POST } from '@axflow/models/shared';

// HuggingFace has the concept of a task. This code supports the "textGeneration" task.
// https://huggingface.co/models?pipeline_tag=text-generation

// https://huggingface.co/docs/api-inference/quicktour#running-inference-with-api-requests
const HF_MODEL_API_URL = 'https://api-inference.huggingface.co/models/';

function headers(accessToken?: string) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
  };
  if (typeof accessToken === 'string') {
    headers.authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

export namespace HfTextGenerationTypes {
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
    accessToken?: string;
    apiUrl?: string;
    fetch?: typeof fetch;
  };

  export type GeneratedText = {
    generated_text: string;
  };

  // https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
  export type Response = GeneratedText | GeneratedText[];

  // Best documentation I could find: https://huggingface.co/docs/huggingface_hub/main/en/package_reference/inference_client#huggingface_hub.inference._text_generation.TextGenerationStreamResponse
  // I would like to find more formal documentation of their streaming API if we can.
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

async function run(
  request: HfTextGenerationTypes.Request,
  options: HfTextGenerationTypes.RequestOptions,
): Promise<HfTextGenerationTypes.Response> {
  const url = options.apiUrl || HF_MODEL_API_URL + request.model;

  const headers_ = headers(options.accessToken);
  const body = JSON.stringify({ ...request, stream: false });
  const response = await POST(url, {
    headers: headers_,
    body,
    fetch: options.fetch,
  });

  return response.json();
}

async function streamBytes(
  request: HfTextGenerationTypes.Request,
  options: HfTextGenerationTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || HF_MODEL_API_URL + request.model;

  const headers_ = headers(options.accessToken);
  const body = JSON.stringify({ ...request, stream: true });
  try {
    const response = await POST(url, {
      headers: headers_,
      body,
      fetch: options.fetch,
    });

    if (!response.body) {
      throw new HttpError('Expected response body to be a ReadableStream', response);
    }

    return response.body;
  } catch (e) {
    if (e instanceof HttpError) {
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

function noop(chunk: HfTextGenerationTypes.Chunk) {
  return chunk;
}

/*
 * Example chunk:
 *   {
 *     token: { id: 11, text: ' and', logprob: -0.00002193451, special: false },
 *     generated_text: null,
 *     details: null
 *   }
 */
function chunkToToken(chunk: HfTextGenerationTypes.Chunk) {
  return chunk.token.text;
}

async function stream(
  request: HfTextGenerationTypes.Request,
  options: HfTextGenerationTypes.RequestOptions,
): Promise<ReadableStream<HfTextGenerationTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new HfDecoderStream(noop));
}

async function streamTokens(
  request: HfTextGenerationTypes.Request,
  options: HfTextGenerationTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new HfDecoderStream(chunkToToken));
}

export class HfGeneration {
  static run = run;
  static streamBytes = streamBytes;
  static stream = stream;
  static streamTokens = streamTokens;
}

class HfDecoderStream<T> extends TransformStream<Uint8Array, T> {
  private static LINES_RE = /data:\s*(.+)/;

  private static parseChunk(lines: string): HfTextGenerationTypes.Chunk | null {
    lines = lines.trim();

    // Empty lines are ignored
    if (lines.length === 0) {
      return null;
    }

    const match = lines.match(HfDecoderStream.LINES_RE);

    try {
      const data = match![1];
      return JSON.parse(data);
    } catch (e) {
      throw new Error(`Malformed streaming data from HF: ${JSON.stringify(lines)}`);
    }
  }

  private static transformer<T>(map: (chunk: HfTextGenerationTypes.Chunk) => T) {
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
        const parsedChunk = HfDecoderStream.parseChunk(buffer.join(''));
        if (parsedChunk) {
          controller.enqueue(map(parsedChunk));
        }

        buffer = [];
      }
    };
  }

  constructor(map: (chunk: HfTextGenerationTypes.Chunk) => T) {
    super({ transform: HfDecoderStream.transformer(map) });
  }
}

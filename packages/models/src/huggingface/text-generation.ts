import { HttpError, POST } from '@axflow/models/shared';

// With Hugging Face, we need to first choose a "task" and then pick a compatible model.
// The tasks we are using (for llama2 for instance): 'text-generation'
// https://huggingface.co/models?pipeline_tag=conversational

// https://huggingface.co/docs/api-inference/quicktour#running-inference-with-api-requests
const HF_MODEL_API_URL = 'https://api-inference.huggingface.co/models/';
// const SUPPORTED_MODELS = ['gpt2'];

function headers(accessToken?: string) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (typeof accessToken === 'string') {
    headers.authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

export namespace HfChatTypes {
  // https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
  export type Request = {
    model: string;
    stream?: boolean;
    inputs: string;
    parameters?: {
      top_k?: number;
      top_p?: number;
      // Float range from 0.00 to 100.00. Default is 1.0
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
  // TODO: check if we also expect 'event' lines. It didn't happen with this model, but could with others?
  export type Chunk = {
    token: {
      id: number;
      text: string;
      logprob: number;
      special: boolean;
    };
    generated_text: string;
    // Observed this but cannot find documentation
    details: null;
  };
}

async function run(
  request: HfChatTypes.Request,
  options: HfChatTypes.RequestOptions,
): Promise<HfChatTypes.Response> {
  // TODO validate the model is supported
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
  request: HfChatTypes.Request,
  options: HfChatTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || HF_MODEL_API_URL + request.model;

  const headers_ = headers(options.accessToken);
  const body = JSON.stringify({ ...request, stream: true });
  const response = await POST(url, {
    headers: headers_,
    body,
    fetch: options.fetch,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

function noop(chunk: HfChatTypes.Chunk) {
  return chunk;
}

async function stream(
  request: HfChatTypes.Request,
  options: HfChatTypes.RequestOptions,
): Promise<ReadableStream<HfChatTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new HfDecoderStream(noop));
}

export class HfGeneration {
  static run = run;
  static streamBytes = streamBytes;
  static stream = stream;
}

class HfDecoderStream<T> extends TransformStream<Uint8Array, T> {
  private static LINES_RE = /data:\s*(.+)/;

  private static parseChunk(lines: string): HfChatTypes.Chunk | null {
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

  private static transformer<T>(map: (chunk: HfChatTypes.Chunk) => T) {
    let buffer: string[] = [];
    const decoder = new TextDecoder();

    return (bytes: Uint8Array, controller: TransformStreamDefaultController<T>) => {
      const chunk = decoder.decode(bytes);

      for (let i = 0, len = chunk.length; i < len; ++i) {
        const bufferLength = buffer.length;
        const isSeparator = chunk[i] === '\n' && buffer[bufferLength - 1] === '\n';

        // Keep buffering unless we've hit the end of a data chunk
        if (!isSeparator) {
          buffer.push(chunk[i]);
          continue;
        }

        const parsedChunk = HfDecoderStream.parseChunk(buffer.join(''));
        if (parsedChunk) {
          controller.enqueue(map(parsedChunk));
        }

        buffer = [];
      }
    };
  }

  constructor(map: (chunk: HfChatTypes.Chunk) => T) {
    super({ transform: HfDecoderStream.transformer(map) });
  }
}

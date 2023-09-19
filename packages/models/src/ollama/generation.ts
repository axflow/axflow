import { HttpError, POST } from '@axflow/models/shared';
import { OllamaModelOptions } from './shared';

// Ollama.ai is an OSS engine to run open source models (like llama2, codellama) locally on macOS machines.
// https://github.com/jmorganca/ollama/blob/main/docs/api.md#response

const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';

export namespace OllamaGenerationTypes {
  // Docs: https://github.com/jmorganca/ollama/blob/main/docs/api.md#parameters
  export type Request = {
    model: string;
    prompt: string;
    system?: string;
    template?: string;
    context?: string;
    options?: OllamaModelOptions;
  };

  export type RequestOptions = {
    apiUrl?: string;
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  };

  // Docs: https://github.com/jmorganca/ollama/blob/main/docs/api.md#response
  export type Chunk = {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    // Below are fields that are present only when done is true
    // All durations are in nanoseconds, per the ollama documentation.
    context?: Array<number>;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
  };
}

/**
 * Stream a generation against an ollama serving endpoint. Return a stream of bytes.
 * Docs: https://github.com/jmorganca/ollama/blob/main/docs/api.md
 *
 * @param request The request body containing the model, prompt, and options.
 * @param options
 * @param options.apiurl The ollama serving url. defaults to http://127.0.0.1:11343.
 * @param options.fetch The fetch implementation to use. defaults to globalthis.fetch.
 * @param options.headers Optionally add additional http headers to the request.
 * @param options.signal An abortsignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
async function streamBytes(
  request: OllamaGenerationTypes.Request,
  options: OllamaGenerationTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || OLLAMA_URL;

  const body = JSON.stringify(request);
  const response = await POST(url, {
    headers: options.headers || {},
    body,
    fetch: options.fetch,
    signal: options.signal,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

function noop(chunk: OllamaGenerationTypes.Chunk) {
  return chunk;
}

/*
 * Return the text from a chunk. If the chunk is a stop token, don't return it to the user.
 * Example ollama chunk:
 *  {
 *     "model":"llama2",
 *     "created_at":"2023-09-18T20:08:59.480415Z",
 *     "response":".",
 *     "done":false
 *   }
 */
function chunkToToken(chunk: OllamaGenerationTypes.Chunk) {
  if (!chunk.done) {
    return chunk.response;
  } else {
    return '';
  }
}

/**
 * Stream a generation against an ollama serving endpoint, return javascript objects.
 *
 * Example chunk:
 *   {
 *     token: { id: 11, text: ' and', logprob: -0.00002193451, special: false },
 *     generated_text: null,
 *     details: null
 *   }
 *
 * @param request The request body containing the model, prompt, and options.
 * @param options
 * @param options.apiurl The ollama serving url. defaults to http://127.0.0.1:11343.
 * @param options.fetch The fetch implementation to use. defaults to globalthis.fetch.
 * @param options.headers Optionally add additional http headers to the request.
 * @param options.signal An abortsignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the api.
 */
async function stream(
  request: OllamaGenerationTypes.Request,
  options: OllamaGenerationTypes.RequestOptions,
): Promise<ReadableStream<OllamaGenerationTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new OllamaDecoderStream(noop));
}

/**
 * Stream a generation against an ollama serving endpoint, return only the text tokens.
 *
 * @param request The request body containing the model, prompt, and options.
 * @param options
 * @param options.apiurl The ollama serving url. defaults to http://127.0.0.1:11343.
 * @param options.fetch The fetch implementation to use. defaults to globalthis.fetch.
 * @param options.headers Optionally add additional http headers to the request.
 * @param options.signal An abortsignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
async function streamTokens(
  request: OllamaGenerationTypes.Request,
  options: OllamaGenerationTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new OllamaDecoderStream(chunkToToken));
}

/**
 * An object that encapsulates methods for calling the HF inference API.
 */
export class OllamaGeneration {
  static streamBytes = streamBytes;
  static stream = stream;
  static streamTokens = streamTokens;
}

class OllamaDecoderStream<T> extends TransformStream<Uint8Array, T> {
  private static parseChunk(line: string): OllamaGenerationTypes.Chunk | null {
    // We expect the Ollama chunks to be lines of parsable JSON directly.
    line = line.trim();

    // Empty lines are ignored
    if (line.length === 0) {
      return null;
    }

    try {
      return JSON.parse(line);
    } catch (e) {
      throw new Error(`Malformed streaming data from Ollama: ${JSON.stringify(line)}`);
    }
  }

  private static transformer<T>(map: (chunk: OllamaGenerationTypes.Chunk) => T) {
    let buffer: string[] = [];
    const decoder = new TextDecoder();

    return (bytes: Uint8Array, controller: TransformStreamDefaultController<T>) => {
      const chunk = decoder.decode(bytes);

      for (let i = 0, len = chunk.length; i < len; ++i) {
        // Ollama's response format is xd-ndjson: each line is a parsable JSON object.
        const isSeparator = chunk[i] === '\n';

        // Keep buffering unless we've hit the end of a data chunk.
        if (!isSeparator) {
          buffer.push(chunk[i]);
          continue;
        }

        // Decode the object into the expected JSON type.
        const parsedChunk = OllamaDecoderStream.parseChunk(buffer.join(''));
        if (parsedChunk) {
          controller.enqueue(map(parsedChunk));
        }

        buffer = [];
      }
    };
  }

  constructor(map: (chunk: OllamaGenerationTypes.Chunk) => T) {
    super({ transform: OllamaDecoderStream.transformer(map) });
  }
}

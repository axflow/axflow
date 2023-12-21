import { HttpError, POST } from '@axflow/models/shared';

const GOOGLE_GENERATE_CONTENT_API_URL = 'https://generativelanguage.googleapis.com/v1';

export namespace GoogleGenerateContentTypes {
  export type RequestOptions = {
    apiKey?: string;
    apiUrl?: string;
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  };

  export type Part = {
    text?: string;
    inlineData?: {
      data: string;
      mimeType: string;
    };
  };

  export type Content = {
    role?: 'user' | 'model';
    parts: Part[];
  };

  export type Request = {
    model: string;
    contents: Content[];
    generationConfig?: {
      temperature?: number;
      stopSequences?: string[];
      candidateCount?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
    };
    safetySettings?: Array<{
      category: string;
      threshold: string;
    }>;
  };

  export type SafetyReason = {
    category: string;
    probability: string;
    blocked?: boolean;
  };

  export type Response = {
    candidates: Array<{
      index: number;
      content: Content;
      finishReason?: string;
      tokenCount?: number;
      safetyRatings: SafetyReason[];
      citationMetadata?: {
        citationSources: Array<{
          uri?: string;
          startIndex?: number;
          endIndex?: number;
          license?: string;
        }>;
      };
    }>;
    promptFeedback?: {
      blockReason?: string;
      safetyRatings: SafetyReason[];
    };
  };

  export type Chunk = Response;
}

function constructUrl({
  baseUrl,
  model,
  stream,
  apiKey,
}: {
  baseUrl: string;
  model: string;
  stream: boolean;
  apiKey?: string;
}) {
  const method = stream ? `streamGenerateContent` : 'generateContent';
  const search = new URLSearchParams();

  if (apiKey) {
    search.set('key', apiKey);
  }

  if (stream) {
    search.set('alt', 'sse');
  }

  const query = search.size === 0 ? '' : `?${search}`;

  return `${baseUrl}/models/${model}:${method}${query}`;
}

function headers(customHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...customHeaders,
  };

  return headers;
}

/**
 * Run a prediction against Google's generate content API.
 *
 * @see https://ai.google.dev/api/rest/v1/models/generateContent
 *
 * @param request The request body sent to Google. See https://ai.google.dev/api/rest/v1/models/generateContent
 * @param options
 * @param options.apiKey Google AI API key.
 * @param options.apiUrl The url of the Google generate content (or compatible) API. Defaults to https://generativelanguage.googleapis.com/v1.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns Google generate content response. See https://ai.google.dev/api/rest/v1/models/generateContent.
 */
async function run(
  request: GoogleGenerateContentTypes.Request,
  options: GoogleGenerateContentTypes.RequestOptions,
): Promise<GoogleGenerateContentTypes.Response> {
  const { model, ...req } = request;

  const url = constructUrl({
    model: model,
    stream: false,
    apiKey: options.apiKey,
    baseUrl: options.apiUrl || GOOGLE_GENERATE_CONTENT_API_URL,
  });

  const response = await POST(url, {
    headers: headers(options.headers),
    body: JSON.stringify(req),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * Run a streaming prediction against Google's generate content API.
 *
 * @see https://ai.google.dev/api/rest/v1/models/streamGenerateContent
 *
 * @param request The request body sent to Google. See https://ai.google.dev/api/rest/v1/models/streamGenerateContent.
 * @param options
 * @param options.apiKey Google AI API key.
 * @param options.apiUrl The url of the Google generate content (or compatible) API. Defaults to https://generativelanguage.googleapis.com/v1.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
async function streamBytes(
  request: GoogleGenerateContentTypes.Request,
  options: GoogleGenerateContentTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const { model, ...req } = request;

  const url = constructUrl({
    model: model,
    stream: true,
    apiKey: options.apiKey,
    baseUrl: options.apiUrl || GOOGLE_GENERATE_CONTENT_API_URL,
  });

  const response = await POST(url, {
    headers: headers(options.headers),
    body: JSON.stringify(req),
    fetch: options.fetch,
    signal: options.signal,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

function noop(chunk: GoogleGenerateContentTypes.Chunk) {
  return chunk;
}

/**
 * Run a streaming prediction against Google's generate content API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://ai.google.dev/api/rest/v1/models/streamGenerateContent
 *
 * @param request The request body sent to Google. See https://ai.google.dev/api/rest/v1/models/streamGenerateContent.
 * @param options
 * @param options.apiKey Google AI API key.
 * @param options.apiUrl The url of the Google generate content (or compatible) API. Defaults to https://generativelanguage.googleapis.com/v1.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
async function stream(
  request: GoogleGenerateContentTypes.Request,
  options: GoogleGenerateContentTypes.RequestOptions,
): Promise<ReadableStream<GoogleGenerateContentTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new GoogleGenerateContentDecoderStream(noop));
}

function chunkToToken(chunk: GoogleGenerateContentTypes.Chunk) {
  return chunk.candidates[0].content.parts[0].text || '';
}

/**
 * Run a streaming prediction against Google's generate content API. The resulting stream emits only the string tokens.
 *
 * @see https://ai.google.dev/api/rest/v1/models/streamGenerateContent
 *
 * @param request The request body sent to Google. See https://ai.google.dev/api/rest/v1/models/streamGenerateContent.
 * @param options
 * @param options.apiKey Google AI API key.
 * @param options.apiUrl The url of the Google generate content (or compatible) API. Defaults to https://generativelanguage.googleapis.com/v1.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
async function streamTokens(
  request: GoogleGenerateContentTypes.Request,
  options: GoogleGenerateContentTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new GoogleGenerateContentDecoderStream(chunkToToken));
}

/**
 * An object that encapsulates methods for calling Google AI's generate content APIs.
 */
export class GoogleGenerateContent {
  static run = run;
  static streamBytes = streamBytes;
  static stream = stream;
  static streamTokens = streamTokens;
}

class GoogleGenerateContentDecoderStream<T> extends TransformStream<Uint8Array, T> {
  static DATA_RE = /data:\s*(.+)/;

  static parseChunk<T>(chunk: string): T | null {
    chunk = chunk.trim();

    if (chunk.length === 0) {
      return null;
    }

    const match = chunk.match(GoogleGenerateContentDecoderStream.DATA_RE);

    try {
      return JSON.parse(match![1]);
    } catch (error) {
      throw new Error(
        `Encountered unexpected chunk while parsing Google generateContentStream response: ${JSON.stringify(
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
        // Events separated by '\r\n\r\n'
        const isChunkSeparator =
          chunk[i] === '\n' &&
          buffer[buffer.length - 1] === '\r' &&
          buffer[buffer.length - 2] === '\n' &&
          buffer[buffer.length - 3] === '\r';

        // Keep buffering unless we've hit the end of a data chunk
        if (!isChunkSeparator) {
          buffer.push(chunk[i]);
          continue;
        }

        const parsedChunk = GoogleGenerateContentDecoderStream.parseChunk<InputChunk>(
          buffer.join(''),
        );

        if (parsedChunk) {
          controller.enqueue(map(parsedChunk));
        }

        buffer = [];
      }
    };
  }

  constructor(map: (chunk: GoogleGenerateContentTypes.Chunk) => T) {
    super({ transform: GoogleGenerateContentDecoderStream.streamTransformer(map) });
  }
}

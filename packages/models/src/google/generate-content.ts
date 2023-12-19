import { POST } from '@axflow/models/shared';

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
    promptFeedback: {
      blockReason?: string;
      safetyRatings: SafetyReason[];
    };
  };
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
  const call = stream ? `streamGenerateContent` : 'generateContent';
  const query = apiKey ? `?key=${apiKey}` : '';
  return `${baseUrl}/models/${model}:${call}${query}`;
}

function headers(customHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    accept: 'application/json',
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
 * @param options.apiKey Google API key.
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
 * An object that encapsulates methods for calling the TogetherAI inference API.
 */
export class GoogleGenerateContent {
  static run = run;
}

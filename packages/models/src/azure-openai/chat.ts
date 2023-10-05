import { POST, HttpError } from '@axflow/models/shared';
import { streamTransformer } from '../openai/shared';

export function headers(apiKey: string, customHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    ...customHeaders,
  };

  if (typeof apiKey === 'string') {
    headers['api-key'] = apiKey;
  }

  return headers;
}

// Our currently supported API version. Swagger spec:
// https://github.com/Azure/azure-rest-api-specs/blob/main/specification/cognitiveservices/data-plane/AzureOpenAI/inference/preview/2023-08-01-preview/inference.json
const API_VERSION = '2023-08-01-preview';
/*
 * Create the base URL for the chat/completions endpoint in azure
 * Docs: https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
 *
 * We currently use the preview branch, and not the stable one, to benefit from openAI functions.
 */
const createUrl = (apiUrl: string | { resourceName: string; deploymentId: string }) => {
  if (typeof apiUrl === 'string') {
    return apiUrl;
  } else {
    return `https://${apiUrl.resourceName}.openai.azure.com/openai/deployments/${apiUrl.deploymentId}/chat/completions?api-version=${API_VERSION}`;
  }
};

export namespace AzureOpenAIChatTypes {
  export type RequestOptions = {
    apiKey: string;
    apiUrl: string | { resourceName: string; deploymentId: string };
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  };
  // https://github.com/Azure/azure-rest-api-specs/blob/d52c50c22ec7f573d49fc3b4c6c931491d92ec8b/specification/cognitiveservices/data-plane/AzureOpenAI/inference/preview/2023-08-01-preview/inference.json#L962C8-L962C36
  export type Message = {
    role: 'assistant' | 'user' | 'system' | 'function';
    content?: string;
    name?: string;
    function_call?: { name: string; arguments: string };
  };

  export type FunctionSpec = {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };

  export type Request = {
    messages: Message[];
    functions?: FunctionSpec[];
    function_call?: 'none' | 'auto' | { name: string };
    n?: number | null;
    temperature?: number | null;
    top_p?: number | null;
    stop?: string | string[] | null;
    max_tokens?: number;
    presence_penalty?: number;
    frequence_penalty?: number;
    logit_bias?: Record<string, number> | number;
    user?: string;
  };

  export type ErrorBase = {
    code: string;
    message: string;
  };

  export type ContentFilterResult = {
    severity: 'safe' | 'low' | 'medium' | 'high';
    filtered: boolean;
  };

  export type ContentFilterResults = {
    sexual: ContentFilterResult;
    violence: ContentFilterResult;
    hate: ContentFilterResult;
    self_harm: ContentFilterResult;
    error: ErrorBase;
  };
  export type PromptFilterResult = {
    prompt_index: number;
    content_filter_results: ContentFilterResults;
  };
  export type Response = {
    id: string;
    object: string;
    created: number;
    model: string;
    prompt_filter_results?: PromptFilterResult[];
    choices: Array<{
      index: number;
      finish_reason: string;
      message: Message;
      content_filter_results: ContentFilterResults;
    }>;
    usage?: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    };
  };

  export type Chunk = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
      index: number;
      delta: Delta;
      finish_reason: 'stop' | 'length' | 'function_call' | null;
    }>;
  };

  export type Delta = {
    role?: 'system' | 'user' | 'assistant' | 'function';
    content?: string | null;
    function_call?: {
      name?: string;
      arguments?: string;
    };
  };
}

/**
 * Run a chat completion against the Azure-openAI API.
 *
 * @see https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#chat-completions
 *
 * @param request The request body sent to Azure. See Azure's documentation for all available parameters.
 * @param options
 * @param options.apiKey Azure API key.
 * @param options.resourceName Azure resource name.
 * @param options.deploymentId Azure deployment id.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. If this is passed, resourceName and deploymentId are ignored.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 *
 * @returns an Azure OpenAI chat completion. See Azure's documentation for /chat/completions
 */
async function run(
  request: AzureOpenAIChatTypes.Request,
  options: AzureOpenAIChatTypes.RequestOptions,
): Promise<AzureOpenAIChatTypes.Response> {
  const url = createUrl(options.apiUrl);

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
    signal: options.signal,
  });

  return response.json();
}

/**
 * Run a streaming chat completion against the Azure-openAI API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#chat-completions
 *
 * @param request The request body sent to Azure. See Azure's documentation for all available parameters.
 * @param options
 * @param options.apiKey Azure API key.
 * @param options.resourceName Azure resource name.
 * @param options.deploymentId Azure deployment id.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. If this is passed, resourceName and deploymentId are ignored.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 *
 * @returns A stream of bytes directly from the API.
 */
async function streamBytes(
  request: AzureOpenAIChatTypes.Request,
  options: AzureOpenAIChatTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = createUrl(options.apiUrl);

  const response = await POST(url, {
    headers: headers(options.apiKey, options.headers),
    body: JSON.stringify({ ...request, stream: true }),
    fetch: options.fetch,
    signal: options.signal,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

function noop(chunk: AzureOpenAIChatTypes.Chunk) {
  return chunk;
}

/**
 * Run a streaming chat completion against the Azure-openAI API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#chat-completions
 *
 * Example object:
 * {"id":"chatcmpl-864d71dHehdlb2Vjq7WP5nHz10LRO","object":"chat.completion.chunk","created":1696458457,"model":"gpt-4","choices":[{"index":0,"finish_reason":null,"delta":{"content":" me"}}],"usage":null}
 *
 * @param request The request body sent to Azure. See Azure's documentation for all available parameters.
 * @param options
 * @param options.apiKey Azure API key.
 * @param options.resourceName Azure resource name.
 * @param options.deploymentId Azure deployment id.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. If this is passed, resourceName and deploymentId are ignored.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 *
 * @returns A stream of objects representing each chunk from the API.
 */
async function stream(
  request: AzureOpenAIChatTypes.Request,
  options: AzureOpenAIChatTypes.RequestOptions,
): Promise<ReadableStream<AzureOpenAIChatTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new OpenAIChatDecoderStream(noop));
}

/**
 * Run a streaming chat completion against the Azure-openAI API. The resulting stream emits only the string tokens.
 *
 * @see https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#chat-completions
 *
 * @param request The request body sent to Azure. See Azure's documentation for all available parameters.
 * @param options
 * @param options.apiKey Azure API key.
 * @param options.resourceName Azure resource name.
 * @param options.deploymentId Azure deployment id.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. If this is passed, resourceName and deploymentId are ignored.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 *
 * @returns A stream of tokens from the API.
 */
async function streamTokens(
  request: AzureOpenAIChatTypes.Request,
  options: AzureOpenAIChatTypes.RequestOptions,
): Promise<ReadableStream<string>> {
  const byteStream = await streamBytes(request, options);
  return byteStream.pipeThrough(new OpenAIChatDecoderStream(chunkToToken));
}

class OpenAIChatDecoderStream<T> extends TransformStream<Uint8Array, T> {
  constructor(map: (chunk: AzureOpenAIChatTypes.Chunk) => T) {
    super({ transform: streamTransformer(map) });
  }
}

// Note that this function is different than vanilla openAI: we can get an empty array of choices.
function chunkToToken(chunk: AzureOpenAIChatTypes.Chunk) {
  if (!chunk.choices || chunk.choices.length === 0) {
    return '';
  }
  return chunk.choices[0].delta.content || '';
}

export class AzureOpenAIChat {
  static run = run;
  static streamBytes = streamBytes;
  static stream = stream;
  static streamTokens = streamTokens;
}

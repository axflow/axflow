import { POST } from '@axflow/models/shared';

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
// https://github.com/Azure/azure-rest-api-specs/blob/main/specification/cognitiveservices/data-plane/AzureOpenAI/inference/stable/2023-05-15/inference.json
const API_VERSION = '2023-05-15';
/*
 * Create the base URL for the chat/completions endpoint in azure
 * Docs: https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
 *
 * We currently use the 2023-05-15 api version, the latest stable one
 * The apiVersion is in the format YYYY-MM-DD, as described in the docs:
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
    stream?: boolean;
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

export class AzureOpenAIChat {
  static run = run;
}

# @axflow/models/azure-openai/chat

Interface with [Azure-OpenAI's Chat Completions API](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference) using this module.

Note that this is very close to the vanilla openAI interface, with some subtle minor differences (the return types contain content filter results, see the `AzureOpenAIChatTypes.ContentFilterResults` type ).

In addition, the streaming methods sometimes return objects with empty `choices` arrays. This is automatically handled if you use the `streamTokens()` method.

```ts
import { AzureOpenAIChat } from '@axflow/models/azure-openai/chat';
import type { AzureOpenAIChatTypes } from '@axflow/models/azure-openai/chat';
```

```ts
declare class AzureOpenAIChat {
  static run: typeof run;
  static stream: typeof stream;
  static streamBytes: typeof streamBytes;
  static streamTokens: typeof streamTokens;
}
```

## `run`

```ts
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
declare function run(
  request: AzureOpenAIChatTypes.Request,
  options: AzureOpenAIChatTypes.RequestOptions
): Promise<AzureOpenAIChatTypes.Response>;
```

## `streamBytes`

```ts
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
declare function streamBytes(
  request: AzureOpenAIChatTypes.Request,
  options: AzureOpenAIChatTypes.RequestOptions
): Promise<ReadableStream<Uint8Array>>;
```

## `stream`

```ts
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
declare function stream(
  request: AzureOpenAIChatTypes.Request,
  options: AzureOpenAIChatTypes.RequestOptions
): Promise<ReadableStream<AzureOpenAIChatTypes.Chunk>>;
```

## `streamTokens`

```ts
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
declare function streamTokens(
  request: AzureOpenAIChatTypes.Request,
  options: AzureOpenAIChatTypes.RequestOptions
): Promise<ReadableStream<string>>;
```

# @axflow/models/openai/chat

Interface with [OpenAI's Chat Completions API](https://platform.openai.com/docs/api-reference/chat) using this module.

```ts
import {OpenAIChat} from '@axflow/models/openai/chat'
import type {OpenAIChatTypes} from '@axflow/models/openai/chat'
```

```ts
declare class OpenAIChat {
  static run: typeof run;
  static stream: typeof stream;
  static streamBytes: typeof streamBytes;
  static streamTokens: typeof streamTokens;
}
```

## `run`

```ts
/**
 * Run a chat completion against the OpenAI API.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/chat/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/chat/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns OpenAI chat completion. See OpenAI's documentation for /v1/chat/completions.
 */
declare function run(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions
): Promise<OpenAIChatTypes.Response>;
```

## `streamBytes`

```ts
/**
 * Run a streaming chat completion against the OpenAI API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/chat/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/chat/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
declare function streamBytes(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions
): Promise<ReadableStream<Uint8Array>>;
```

## `stream`

```ts
/**
 * Run a streaming chat completion against the OpenAI API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/chat/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/chat/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
declare function stream(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions
): Promise<ReadableStream<OpenAIChatTypes.Chunk>>;
```

## `streamTokens`

```ts
/**
 * Run a streaming chat completion against the OpenAI API. The resulting stream emits only the string tokens.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/chat/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/chat/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
declare function streamTokens(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions
): Promise<ReadableStream<string>>;
```
# @axflow/models/openai/completion

Interface with [OpenAI's Completions API](https://platform.openai.com/docs/api-reference/completions) using this module.

```ts
import {OpenAICompletion} from '@axflow/models/openai/completion'
import type {OpenAICompletionTypes} from '@axflow/models/openai/completion'
```

```ts
declare class OpenAICompletion {
  static run: typeof run;
  static stream: typeof stream;
  static streamBytes: typeof streamBytes;
  static streamTokens: typeof streamTokens;
}
```

## `run`

```ts
/**
 * Run a completion against the OpenAI API.
 *
 * @see https://platform.openai.com/docs/api-reference/completions
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns OpenAI completion. See OpenAI's documentation for /v1/completions.
 */
declare function run(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions
): Promise<OpenAICompletionTypes.Response>;
```

## `streamBytes`

```ts
/**
 * Run a streaming completion against the OpenAI API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://platform.openai.com/docs/api-reference/completions
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
declare function streamBytes(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions
): Promise<ReadableStream<Uint8Array>>;
```

## `stream`

```ts
/**
 * Run a streaming completion against the OpenAI API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://platform.openai.com/docs/api-reference/completions
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
declare function stream(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions
): Promise<ReadableStream<OpenAICompletionTypes.Chunk>>;
```

## `streamTokens`

```ts
/**
 * Run a streaming completion against the OpenAI API. The resulting stream emits only the string tokens.
 *
 * @see https://platform.openai.com/docs/api-reference/completions
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/completions for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/completions.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
declare function streamTokens(
  request: OpenAICompletionTypes.Request,
  options: OpenAICompletionTypes.RequestOptions
): Promise<ReadableStream<string>>;
```

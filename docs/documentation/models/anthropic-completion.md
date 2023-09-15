# @axflow/models/anthropic/completion

Interface with [Anthropic's Completion API](https://docs.anthropic.com/claude/reference/complete_post) using this module.

```ts
import {AnthropicCompletion} from '@axflow/models/anthropic/completion'
import type {AnthropicCompletionTypes} from '@axflow/models/anthropic/completion'
```

```ts
declare class AnthropicCompletion {
  static run: typeof run;
  static stream: typeof stream;
  static streamBytes: typeof streamBytes;
  static streamTokens: typeof streamTokens;
}
```

## `run`

```ts
/**
 * Run a completion against the Anthropic API.
 *
 * @see https://docs.anthropic.com/claude/reference/complete_post
 *
 * @param request The request body sent to Anthropic. See Anthropic's documentation for /v1/complete for supported parameters.
 * @param options
 * @param options.apiKey Anthropic API key.
 * @param options.apiUrl The url of the Anthropic (or compatible) API. Defaults to https://api.anthropic.com/v1/complete.
 * @param options.version The Anthropic API version. Defaults to 2023-06-01. Note that older versions are not currently supported.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns Anthropic completion. See Anthropic's documentation for /v1/complete.
 */
declare function run(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions
): Promise<AnthropicCompletionTypes.Response>;
```

## `streamBytes`

```ts
/**
 * Run a streaming completion against the Anthropic API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://docs.anthropic.com/claude/reference/complete_post
 * @see https://docs.anthropic.com/claude/reference/streaming
 *
 * @param request The request body sent to Anthropic. See Anthropic's documentation for /v1/complete for supported parameters.
 * @param options
 * @param options.apiKey Anthropic API key.
 * @param options.apiUrl The url of the Anthropic (or compatible) API. Defaults to https://api.anthropic.com/v1/complete.
 * @param options.version The Anthropic API version. Defaults to 2023-06-01. Note that older versions are not currently supported.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
declare function streamBytes(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions
): Promise<ReadableStream<Uint8Array>>;
```

## `stream`

```ts
/**
 * Run a streaming completion against the Anthropic API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://docs.anthropic.com/claude/reference/complete_post
 * @see https://docs.anthropic.com/claude/reference/streaming
 *
 * @param request The request body sent to Anthropic. See Anthropic's documentation for /v1/complete for supported parameters.
 * @param options
 * @param options.apiKey Anthropic API key.
 * @param options.apiUrl The url of the Anthropic (or compatible) API. Defaults to https://api.anthropic.com/v1/complete.
 * @param options.version The Anthropic API version. Defaults to 2023-06-01. Note that older versions are not currently supported.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
declare function stream(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions
): Promise<ReadableStream<AnthropicCompletionTypes.Chunk>>;
```

## `streamTokens`

```ts
/**
 * Run a streaming completion against the Anthropic API. The resulting stream emits only the string tokens.
 *
 * @see https://docs.anthropic.com/claude/reference/complete_post
 * @see https://docs.anthropic.com/claude/reference/streaming
 *
 * @param request The request body sent to Anthropic. See Anthropic's documentation for /v1/complete for supported parameters.
 * @param options
 * @param options.apiKey Anthropic API key.
 * @param options.apiUrl The url of the Anthropic (or compatible) API. Defaults to https://api.anthropic.com/v1/complete.
 * @param options.version The Anthropic API version. Defaults to 2023-06-01. Note that older versions are not currently supported.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
declare function streamTokens(
  request: AnthropicCompletionTypes.Request,
  options: AnthropicCompletionTypes.RequestOptions
): Promise<ReadableStream<string>>;
```
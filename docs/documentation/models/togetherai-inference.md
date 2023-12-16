# @axflow/models/togetherai/inference

Interface with [TogetherAI's Inference API](https://docs.together.ai/reference/inference) using this module.

```ts
import { TogetherAIInference } from '@axflow/models/togetherai/inference';
import type { TogetherAIInferenceTypes } from '@axflow/models/togetherai/inference';
```

```ts
declare class TogetherAIInference {
  static run: typeof run;
  static stream: typeof stream;
  static streamBytes: typeof streamBytes;
  static streamTokens: typeof streamTokens;
}
```

## `run`

```ts
/**
 * Run a prediction request against TogetherAI's inference API.
 *
 * @see https://docs.together.ai/reference/inference
 *
 * @param request The request body sent to TogetherAI. See https://docs.together.ai/reference/inference.
 * @param options
 * @param options.apiKey TogetherAI API key.
 * @param options.apiUrl The url of the TogetherAI (or compatible) API. Defaults to https://api.together.xyz/inference.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns TogetherAI inference response. See https://docs.together.ai/reference/inference.
 */
declare function run(
  request: TogetherAIInferenceTypes.Request,
  options: TogetherAIInferenceTypes.RequestOptions
): Promise<TogetherAIInferenceTypes.Response>;
```

## `streamBytes`

```ts
/**
 * Run a streaming prediction request against TogetherAI's inference API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://docs.together.ai/reference/inference
 *
 * @param request The request body sent to TogetherAI. See https://docs.together.ai/reference/inference.
 * @param options
 * @param options.apiKey TogetherAI API key.
 * @param options.apiUrl The url of the TogetherAI (or compatible) API. Defaults to https://api.together.xyz/inference.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
declare function streamBytes(
  request: TogetherAIInferenceTypes.Request,
  options: TogetherAIInferenceTypes.RequestOptions
): Promise<ReadableStream<Uint8Array>>;
```

## `stream`

```ts
/**
 * Run a streaming prediction request against TogetherAI's inference API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://docs.together.ai/reference/inference
 *
 * @param request The request body sent to TogetherAI. See https://docs.together.ai/reference/inference.
 * @param options
 * @param options.apiKey TogetherAI API key.
 * @param options.apiUrl The url of the TogetherAI (or compatible) API. Defaults to https://api.together.xyz/inference.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
declare function stream(
  request: TogetherAIInferenceTypes.Request,
  options: TogetherAIInferenceTypes.RequestOptions
): Promise<ReadableStream<TogetherAIInferenceTypes.Chunk>>;
```

## `streamTokens`

```ts
/**
 * Run a streaming prediction request against TogetherAI's inference API. The resulting stream emits only the string tokens.
 *
 * @see https://docs.together.ai/reference/inference
 *
 * @param request The request body sent to TogetherAI. See https://docs.together.ai/reference/inference.
 * @param options
 * @param options.apiKey TogetherAI API key.
 * @param options.apiUrl The url of the TogetherAI (or compatible) API. Defaults to https://api.together.xyz/inference.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
declare function streamTokens(
  request: TogetherAIInferenceTypes.Request,
  options: TogetherAIInferenceTypes.RequestOptions
): Promise<ReadableStream<string>>;
```

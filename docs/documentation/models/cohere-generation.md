# @axflow/models/cohere/generation

Interface with [Cohere's Generation API](https://docs.cohere.com/reference/generate) using this module.

```ts
import {CohereGeneration} from '@axflow/models/cohere/generation'
import type {CohereGenerationTypes} from '@axflow/models/cohere/generation'
```

```ts
declare class CohereGeneration {
  static run: typeof run;
  static stream: typeof stream;
  static streamBytes: typeof streamBytes;
  static streamTokens: typeof streamTokens;
}
```

## `run`

```ts
/**
 * Run a generation against the Cohere API.
 *
 * @see https://docs.cohere.com/reference/generate
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/generate for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/generate.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns Cohere completion. See Cohere's documentation for /v1/generate.
 */
declare function run(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions
): Promise<CohereGenerationTypes.Response>;
```

## `streamBytes`

```ts
/**
 * Run a streaming generation against the Cohere API. The resulting stream is the raw unmodified bytes from the API.
 *
 * @see https://docs.cohere.com/reference/generate
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/generate for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/generate.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
declare function streamBytes(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions
): Promise<ReadableStream<Uint8Array>>;
```

## `stream`

```ts
/**
 * Run a streaming generation against the Cohere API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://docs.cohere.com/reference/generate
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/generate for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/generate.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
declare function stream(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions
): Promise<ReadableStream<CohereGenerationTypes.Chunk>>;
```

## `streamTokens`

```ts
/**
 * Run a streaming generation against the Cohere API. The resulting stream emits only the string tokens.
 *
 * @see https://docs.cohere.com/reference/generate
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/generate for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/generate.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
declare function streamTokens(
  request: CohereGenerationTypes.Request,
  options: CohereGenerationTypes.RequestOptions
): Promise<ReadableStream<string>>;
```

# @axflow/models/ollama/generation

Interface with [local ollama models](https://ollama.ai) using this module.

```ts
import { OllamaGeneration } from '@axflow/models/ollama/generation';
import type { OllamaGenerationTypes } from '@axflow/models/ollama/generation';
```

```ts
declare class OllamaGeneration {
  static stream: typeof stream;
  static streamBytes: typeof streamBytes;
  static streamTokens: typeof streamTokens;
}
```

::: info
Ollama only provides streaming APIs, so Axflow does the same.
:::

## `streamBytes`

```ts
/**
 * Stream a generation against an ollama serving endpoint. Return a stream of bytes.
 * Docs: https://github.com/jmorganca/ollama/blob/main/docs/api.md
 *
 * @param request The request body containing the model, prompt, and options.
 * @param options
 * @param options.apiurl The ollama serving url. defaults to http://127.0.0.1:11343.
 * @param options.fetch The fetch implementation to use. defaults to globalthis.fetch.
 * @param options.headers Optionally add additional http headers to the request.
 * @param options.signal An abortsignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
declare function streamBytes(
  request: OllamaGenerationTypes.Request,
  options: OllamaGenerationTypes.RequestOptions
): Promise<ReadableStream<Uint8Array>>;
```

## `stream`

```ts
/**
 * Stream a generation against an ollama serving endpoint, return javascript objects.
 *
 * Example chunk:
 *   {
 *     token: { id: 11, text: ' and', logprob: -0.00002193451, special: false },
 *     generated_text: null,
 *     details: null
 *   }
 *
 * @param request The request body containing the model, prompt, and options.
 * @param options
 * @param options.apiurl The ollama serving url. defaults to http://127.0.0.1:11343.
 * @param options.fetch The fetch implementation to use. defaults to globalthis.fetch.
 * @param options.headers Optionally add additional http headers to the request.
 * @param options.signal An abortsignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the api.
 */
declare function stream(
  request: OllamaGenerationTypes.Request,
  options: OllamaGenerationTypes.RequestOptions
): Promise<ReadableStream<OllamaGenerationTypes.Chunk>>;
```

## `streamTokens`

```ts
/**
 * Stream a generation against an ollama serving endpoint, return only the text tokens.
 *
 * @param request The request body containing the model, prompt, and options.
 * @param options
 * @param options.apiurl The ollama serving url. defaults to http://127.0.0.1:11343.
 * @param options.fetch The fetch implementation to use. defaults to globalthis.fetch.
 * @param options.headers Optionally add additional http headers to the request.
 * @param options.signal An abortsignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
declare function streamTokens(
  request: OllamaGenerationTypes.Request,
  options: OllamaGenerationTypes.RequestOptions
): Promise<ReadableStream<string>>;
```

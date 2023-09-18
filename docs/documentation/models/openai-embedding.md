# @axflow/models/openai/embedding

Interface with [OpenAI's Embeddings API](https://platform.openai.com/docs/api-reference/embeddings) using this module.

```ts
import {OpenAIEmbedding} from '@axflow/models/openai/embedding'
import type {OpenAIEmbeddingTypes} from '@axflow/models/openai/embedding'
```

```ts
declare class OpenAIEmbedding {
  static run: typeof run;
}
```

## `run`

```ts
/**
 * Calculate text embeddings using the OpenAI API.
 *
 * @see https://platform.openai.com/docs/api-reference/embeddings
 *
 * @param request The request body sent to OpenAI. See OpenAI's documentation for /v1/embeddings for supported parameters.
 * @param options
 * @param options.apiKey OpenAI API key.
 * @param options.apiUrl The url of the OpenAI (or compatible) API. Defaults to https://api.openai.com/v1/embeddings.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns An object consisting of the text embeddings and other metadata. See OpenAI's documentation for /v1/embeddings.
 */
declare function run(
  request: OpenAIEmbeddingTypes.Request,
  options: OpenAIEmbeddingTypes.RequestOptions
): Promise<OpenAIEmbeddingTypes.Response>;
```

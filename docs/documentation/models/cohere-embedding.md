# @axflow/models/cohere/embedding

Interface with [Cohere's Embeddings API](https://docs.cohere.com/reference/embed) using this module.

```ts
import {CohereEmbedding} from '@axflow/models/cohere/embedding'
import type {CohereEmbeddingTypes} from '@axflow/models/cohere/embedding'
```

```ts
declare class CohereEmbedding {
  static run: typeof run;
}
```

## `run`

```ts
/**
 * Calculate text embeddings using the Cohere API.
 *
 * @see https://docs.cohere.com/reference/embed
 *
 * @param request The request body sent to Cohere. See Cohere's documentation for /v1/embed for supported parameters.
 * @param options
 * @param options.apiKey Cohere API key.
 * @param options.apiUrl The url of the Cohere (or compatible) API. Defaults to https://api.cohere.ai/v1/embed.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @returns An object consisting of the text embeddings and other metadata. See Cohere's documentation for /v1/embed.
 */
declare function run(
  request: CohereEmbeddingTypes.Request,
  options: CohereEmbeddingTypes.RequestOptions
): Promise<CohereEmbeddingTypes.Response>;
```

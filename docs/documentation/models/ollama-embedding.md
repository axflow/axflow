# @axflow/models/ollama/embedding

Interface with [Ollama's Embeddings API](https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-embeddings) using this module.

```ts
import { OllamaEmbedding } from '@axflow/models/ollama/embedding';
import type { OllamaEmbeddingTypes } from '@axflow/models/ollama/embedding';
```

```ts
declare class OllamaEmbedding {
  static run: typeof run;
}
```

## `run`

```ts
/**
 * Calculate text embeddings using a model served by Ollama.
 *
 * @see https://github.com/jmorganca/ollama/blob/main/docs/api.md#generate-embeddings
 *
 * @param request The request body sent to Ollama. It contains the prompt, the model, and some options.
 * @param options
 * @param options.apiUrl The url where the ollama embedding endpoint is served. Defaults to http://127.0.0.1:11434/api/embeddings.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns An object consisting of the text embeddings for the given prompt.
 */
declare function run(
  request: OllamaEmbeddingTypes.Request,
  options: OllamaEmbeddingTypes.RequestOptions
): Promise<OllamaEmbeddingTypeOllamaEmbeddingTypes.Response>;
```

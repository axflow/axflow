# @axflow/models/huggingface/generation

Interface with [HuggingFace's Inference API](https://huggingface.co/docs/api-inference/quicktour) using this module.

```ts
import { HuggingFaceTextGeneration } from '@axflow/models/huggingface/text-generation';
import type { HuggingFaceTextGenerationTypes } from '@axflow/models/huggingface/text-generation';
```

```ts
declare class HuggingFaceTextGeneration {
  static run: typeof run;
  static stream: typeof stream;
  static streamBytes: typeof streamBytes;
  static streamTokens: typeof streamTokens;
}
```

## `run`

```ts
/**
 * Run a textGeneration task against the HF inference API
 *
 * @see https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
 *
 * @param request The request body sent to HF. See their documentation linked above for details
 * @param options
 * @param options.apiKey The HuggingFace access token. If not provided, requests will be throttled
 * @param options.apiUrl The HuggingFace API URL. Defaults to https://api-inference.huggingface.co/models/
 * @param options.fetch The fetch implementation to use. Defaults to globalThis.fetch
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns The response body from HF. See their documentation linked above for details
 */
declare function run(
  request: HuggingFaceTextGenerationTypes.Request,
  options: HuggingFaceTextGenerationTypes.RequestOptions
): Promise<HuggingFaceTextGenerationTypes.Response>;
```

## `streamBytes`

```ts
/**
 * Stream a textGeneration task against the HF inference API. The resulting stream is the raw unmodified bytes from the API
 *
 * @see https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
 *
 * @param request The request body sent to HF. See their documentation linked above for details
 * @param options
 * @param options.apiKey The HuggingFace access token. If not provided, requests will be throttled
 * @param options.apiUrl The HuggingFace API URL. Defaults to https://api-inference.huggingface.co/models/
 * @param options.fetch The fetch implementation to use. Defaults to globalThis.fetch
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
declare function streamBytes(
  request: HuggingFaceTextGenerationTypes.Request,
  options: HuggingFaceTextGenerationTypes.RequestOptions
): Promise<ReadableStream<Uint8Array>>;
```

## `stream`

```ts
/**
 * Stream a textGeneration task against the HF inference API. The resulting stream is the parsed stream data as JavaScript objects.
 * Example chunk:
 *   {
 *     token: { id: 11, text: ' and', logprob: -0.00002193451, special: false },
 *     generated_text: null,
 *     details: null
 *   }
 *
 * @see https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
 *
 * @param request The request body sent to HF. See their documentation linked above for details
 * @param options
 * @param options.apiKey The HuggingFace access token. If not provided, requests will be throttled
 * @param options.apiUrl The HuggingFace API URL. Defaults to https://api-inference.huggingface.co/models/
 * @param options.fetch The fetch implementation to use. Defaults to globalThis.fetch
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API
 */
declare function stream(
  request: HuggingFaceTextGenerationTypes.Request,
  options: HuggingFaceTextGenerationTypes.RequestOptions
): Promise<ReadableStream<HuggingFaceTextGenerationTypes.Chunk>>;
```

## `streamTokens`

```ts
/**
 * Run a streaming completion against the HF inference API. The resulting stream emits only the string tokens.
 * Note that this will strip the STOP token '</s>' from the text.
 *
 * @see https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
 *
 * @param request The request body sent to HF. See their documentation linked above for details
 * @param options
 * @param options.apiKey The HuggingFace access token. If not provided, requests will be throttled
 * @param options.apiUrl The HuggingFace API URL. Defaults to https://api-inference.huggingface.co/models/
 * @param options.fetch The fetch implementation to use. Defaults to globalThis.fetch
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
declare function streamTokens(
  request: HuggingFaceTextGenerationTypes.Request,
  options: HuggingFaceTextGenerationTypes.RequestOptions
): Promise<ReadableStream<string>>;
```

## Using Inference Endpoints

You might have hosted your own model through HuggingFace's Inference Endpoints product.
This is perfectly compatible with axflow's huggingface library, simply pass in the inference URL to the `HuggingFaceTextGeneration` request with the `apiUrl` parameter, like below:

```ts
const response = await HuggingFaceTextGeneration.stream(
  {
    model: 'llama2-7b',
    inputs: 'Write a typescript function to add two numbers',
    parameters: {
      max_new_tokens: 100,
    },
  },
  {
    apiKey: process.env.HUGGINGFACE_ACCESS_TOKEN!,
    apiUrl: 'https://styuqm054heenl9w.us-east-1.aws.endpoints.huggingface.cloud',
  }
);
```

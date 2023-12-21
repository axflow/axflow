# @axflow/models/google/generate-content

Interface with [Google's generate content API](https://ai.google.dev/api/rest/v1/models/generateContent) using this module.

```ts
import { GoogleGenerateContent } from '@axflow/models/google/generate-content';
import type { GoogleGenerateContentTypes } from '@axflow/models/google/generate-content';
```

```ts
declare class GoogleGenerateContent {
  static run: typeof run;
  static stream: typeof stream;
  static streamBytes: typeof streamBytes;
  static streamTokens: typeof streamTokens;
}
```

## `run`

```ts
/**
 * Run a prediction against Google's generate content API.
 *
 * @see https://ai.google.dev/api/rest/v1/models/generateContent
 *
 * @param request The request body sent to Google. See https://ai.google.dev/api/rest/v1/models/generateContent
 * @param options
 * @param options.apiKey Google AI API key.
 * @param options.apiUrl The url of the Google generate content (or compatible) API. Defaults to https://generativelanguage.googleapis.com/v1.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns Google generate content response. See https://ai.google.dev/api/rest/v1/models/generateContent.
 */
declare function run(
  request: GoogleGenerateContentTypes.Request,
  options: GoogleGenerateContentTypes.RequestOptions
): Promise<GoogleGenerateContentTypes.Response>;
```

## `streamBytes`

```ts
/**
 * Run a streaming prediction against Google's generate content API.
 *
 * @see https://ai.google.dev/api/rest/v1/models/streamGenerateContent
 *
 * @param request The request body sent to Google. See https://ai.google.dev/api/rest/v1/models/streamGenerateContent.
 * @param options
 * @param options.apiKey Google AI API key.
 * @param options.apiUrl The url of the Google generate content (or compatible) API. Defaults to https://generativelanguage.googleapis.com/v1.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of bytes directly from the API.
 */
declare function streamBytes(
  request: GoogleGenerateContentTypes.Request,
  options: GoogleGenerateContentTypes.RequestOptions
): Promise<ReadableStream<Uint8Array>>;
```

## `stream`

```ts
/**
 * Run a streaming prediction against Google's generate content API. The resulting stream is the parsed stream data as JavaScript objects.
 *
 * @see https://ai.google.dev/api/rest/v1/models/streamGenerateContent
 *
 * @param request The request body sent to Google. See https://ai.google.dev/api/rest/v1/models/streamGenerateContent.
 * @param options
 * @param options.apiKey Google AI API key.
 * @param options.apiUrl The url of the Google generate content (or compatible) API. Defaults to https://generativelanguage.googleapis.com/v1.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of objects representing each chunk from the API.
 */
declare function stream(
  request: GoogleGenerateContentTypes.Request,
  options: GoogleGenerateContentTypes.RequestOptions
): Promise<ReadableStream<GoogleGenerateContentTypes.Chunk>>;
```

## `streamTokens`

```ts
/**
 * Run a streaming prediction against Google's generate content API. The resulting stream emits only the string tokens.
 *
 * @see https://ai.google.dev/api/rest/v1/models/streamGenerateContent
 *
 * @param request The request body sent to Google. See https://ai.google.dev/api/rest/v1/models/streamGenerateContent.
 * @param options
 * @param options.apiKey Google AI API key.
 * @param options.apiUrl The url of the Google generate content (or compatible) API. Defaults to https://generativelanguage.googleapis.com/v1.
 * @param options.fetch A custom implementation of fetch. Defaults to globalThis.fetch.
 * @param options.headers Optionally add additional HTTP headers to the request.
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @returns A stream of tokens from the API.
 */
declare function streamTokens(
  request: GoogleGenerateContentTypes.Request,
  options: GoogleGenerateContentTypes.RequestOptions
): Promise<ReadableStream<string>>;
```

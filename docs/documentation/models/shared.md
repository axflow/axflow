# @axflow/models/shared

A set of shared utilities for working with streams, HTTP, and more.

```ts
import {
  IterableToStream,
  StreamToIterable,
  NdJsonStream,
  StreamingJsonResponse,
  POST,
  HttpError,
  isHttpError,
} from '@axflow/models/shared';
import type { NdJsonValueType, JSONValueType, MessageType } from '@axflow/models/shared';
```

## `IterableToStream`

```ts
/**
 * Converts an AsyncIterable<T> to a ReadableStream<T>.
 *
 * ReadableStreams implement this natively as `ReadableStream.from` but this is
 * hardly available in any environments as of the time this was written.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/from_static
 *
 * @param iterable Any async iterable object.
 * @returns A ReadableStream over the iterable contents.
 */
declare function IterableToStream<T>(iterable: AsyncIterable<T>): ReadableStream<T>;
```

## `StreamToIterable`

```ts
/**
 * Convert a ReadableStream<T> to an AsyncIterable<T>.
 *
 * ReadableStreams implement this natively in recent node versions. Unfortunately, older
 * node versions, most browsers, and the TypeScript type system do not support it yet.
 *
 * Example:
 *
 *     for await (const chunk of StreamToIterable(stream)) {
 *       // Do stuff with chunk
 *     }
 *
 * @param stream A ReadableStream.
 * @returns An AsyncIterable over the stream contents.
 */
declare function StreamToIterable<T>(stream: ReadableStream<T>): AsyncIterable<T>;
```

## `NdJsonStream`

The [streaming guide](/guides/models/building-client-applications.md) for more information.

```ts
/**
 * An object that can encode and decode newline-delimited JSON in the following format:
 *
 *     { type: 'data' | 'chunk', value: <any valid JSON value> }
 *
 * When `type` is `chunk`, `value` represents a chunk of the source stream. When `type`
 * is `data`, `value` represents any additional data sent along with the source stream.
 *
 * @see http://ndjson.org
 */
declare class NdJsonStream {
  /**
   * These are the proper headers for newline-delimited JSON streams.
   *
   * @see http://ndjson.org
   */
  static headers: Readonly<{
    'content-type': 'application/x-ndjson; charset=utf-8';
  }>;
  /**
   * Transforms a stream of JSON-serializable objects to stream of newline-delimited JSON.
   *
   * Each object is wrapped with an object that specifies the `type` and references
   * the `value`. The `type` is one of `chunk` or `data`. A type of `chunk` means that
   * the `value` corresponds to chunks from the input stream. A type of `data` means
   * that the `value` corresponds to the additional data provided as the second argument
   * to this function.
   *
   *
   * Example WITHOUT additional data:
   *
   *     const chunk = { key: 'value' };
   *     const stream = new ReadableStream({start(con) { con.enqueue(chunk); con.close() }});
   *     const ndJsonStream = NdJsonStream.encode(stream);
   *     const entries = [];
   *     for await (const chunk of stream) {
   *       entry.push(new TextDecoder().decode(chunk));
   *     }
   *     console.log(entries); // [ "{\"type\":\"chunk\",\"value\":{\"key\":\"value\"}}\n" ]
   *
   *
   * Example WITH additional data:
   *
   *     const chunk = { key: 'value' };
   *     const stream = new ReadableStream({start(con) { con.enqueue(chunk); con.close() }});
   *     const ndJsonStream = NdJsonStream.encode(stream, { data: [{ extra: 'data' }] });
   *     const entries = [];
   *     for await (const chunk of stream) {
   *       entry.push(new TextDecoder().decode(chunk));
   *     }
   *     console.log(entries); // [ "{\"type\":\"data\",\"value\":{\"extra\":\"data\"}}\n", "{\"type\":\"chunk\",\"value\":{\"key\":\"value\"}}\n" ]
   *
   * @see http://ndjson.org
   *
   * @param stream A readable stream of chunks to encode as newline-delimited JSON.
   * @param options
   * @param options.data Additional data to enqueue to the output stream. If data is a `Promise`, the stream will wait for it to resolve and enqueue its resolved values before closing.
   * @returns A readable stream of newline-delimited JSON.
   */
  static encode<T = any>(
    stream: ReadableStream<T>,
    options?: {
      data?: JSONValueType[] | Promise<JSONValueType[]>;
    }
  ): ReadableStream<Uint8Array>;
  /**
   * Transforms a stream of newline-delimited JSON to a stream of objects.
   *
   * @see http://ndjson.org
   *
   * @param stream A readable stream of newline-delimited JSON objects.
   * @returns A readable stream of objects.
   */
  static decode(stream: ReadableStream<Uint8Array>): ReadableStream<NdJsonValueType>;
}
```

## `StreamingJsonResponse`

The [streaming guide](/guides/models/building-client-applications.md) for more information.

```ts
/**
 * A subclass of `Response` that streams newline-delimited JSON.
 */
declare class StreamingJsonResponse<T> extends Response {
  /**
   * Create a `Response` object that streams newline-delimited JSON objects.
   *
   * Example
   *
   *      export async function POST(request: Request) {
   *       const req = await request.json();
   *       const stream = await OpenAIChat.stream(req, { apiKey: OPENAI_API_KEY });
   *       return new StreamingJsonResponse(stream, {
   *         map: (chunk) => chunk.choices[0].delta.content ?? ''
   *         data: [{ stream: "additional" }, { data: "here" }]
   *       });
   *     }
   *
   * @see http://ndjson.org
   *
   * @param stream A readable stream of chunks to encode as newline-delimited JSON.
   * @param options
   * @param options.status HTTP response status.
   * @param options.statusText HTTP response status text.
   * @param options.headers HTTP response headers.
   * @param options.data Additional data to enqueue to the output stream. If data is a `Promise`, the stream will wait for it to resolve and enqueue its resolved values before closing.
   */
  constructor(
    stream: ReadableStream<T>,
    options?: ResponseInit & {
      data?: JSONValueType[] | Promise<JSONValueType[]>;
    }
  );
}
```

## `POST`

Wrapper around fetch.

```ts
declare function POST(url: string, ptions?: HttpOptionsType): Promise<Response>;
```

## `HttpError`

An error class raised by `POST`.

```ts
declare class HttpError extends Error {
  readonly code: number;
  readonly response: Response;
  constructor(message: string, response: Response);
}
```

## `isHttpError`

Utility method to check if an error is an `HttpError`.

```ts
declare function isHttpError(e: unknown): e is HttpError;
```

## `NdJsonValueType`

The type of each JSON object in a newline-delimited JSON event stream.

```ts
type NdJsonValueType = {
  type: 'chunk' | 'data';
  value: JSONValueType;
};
```

## `JSONValueType`

A type representing any value that can be serialized to JSON.

```ts
type JSONValueType =
  | null
  | string
  | number
  | boolean
  | {
      [x: string]: JSONValueType;
    }
  | Array<JSONValueType>;
```

## `FunctionType`

If using OpenAI functions, this type corresponds to the functions passed to OpenAI as part of a request.

See https://platform.openai.com/docs/api-reference/chat/create for more information.

```ts
type FunctionType = {
  name: string;
  description?: string;
  parameters: JSONValueType;
};
```

## `ToolType`

Tools have replaced functions in openAI's nomenclature. Functions are now a type of tools,
and each LLM response can contain multiple tool calls.

```ts
type ToolType = {
  type: 'function';
  function: FunctionType;
};
```

## `ToolCallType`

When the LLM decides to call a tool (previously named a function), this is
the type that we send down to the client.

```ts
type ToolCallType = {
  index: number;
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};
```

## `MessageType`

This is the type of each message in a chat, mostly used by the `useChat` hook.

```ts
type MessageType = {
  /**
   * Can be any unique string.
   *
   * For example, the `useChat` hook uses UUIDs because of their native availability in both Node and browsers.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
   */
  id: string;
  /**
   * Specifies who this message is from.
   */
  role: 'user' | 'assistant' | 'system';
  /**
   * The content of the message. If the message was a function call from the assistant,
   * then this field will be an empty string and the `functionCall` field will be populated.
   */
  content: string;
  /**
   * The time this message was created, expressed as milliseconds since Epoch.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
   */
  created: number;
  /**
   * Any additional data to associate with the message.
   */
  data?: JSONValueType[];
  /**
   * If using OpenAI functions, the functions available to the assistant can be defined here.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/create
   */
  functions?: FunctionType[];
  /**
   * If using OpenAI functions and the assistant responds with a function call,
   * this field will be populated with the function invocation information.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/object
   */
  functionCall?: {
    name: string;
    arguments: string;
  };
  /**
   * If using openAI tools, the tools available to the assistant can be defined here.
   *
   * @see  https://platform.openai.com/docs/guides/function-calling
   */
  tools?: ToolType[];
  /**
   * If using OpenAI tools and the assistant responds with one or more tool calls,
   * this field will be populated with the tool invocation information.
   *
   *
   * @see https://platform.openai.com/docs/guides/function-calling
   */
  toolCalls?: ToolCallType[];
};
```

## `createMessage`

```ts
/*
 * Create a new MessageType object and assign default values.
 * This is particularly useful if the user doesn't want to bother
 * creating an Id and/or a created timestamp, and would like a default
 * behavior for these.
 *
 * @param message - The message object to create, a Partial<MessageType> object.
 * @returns A MessageType object, with all required values assigned.
 */
declare function createMessage = (message: Partial<MessageType>): MessageType;
```

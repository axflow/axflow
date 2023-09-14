# Streaming

This guide covers streaming concepts with @axflow/models.

LLM requests tend to have high latency compared to most other web requests. Streaming is important for the user experience because it reduces the perceived latency of the request by incrementally revealing the response to the user.

While streaming is not a new concept, it tends to be tedious to work with, particularly for more advanced use cases like streaming a mixture of LLM tokens and additional arbitrary data within a single response.

Streaming is trivial when using Axflow, for both basic and advanced use cases.

## The basics

For models that support streaming, there are a few streaming methods: `streamBytes`, `stream`, and `streamTokens`. Each of these return a `ReadableStream`.

* `streamBytes` streams the raw response bytes from the underyling LLM API. Useful for building low-overhead functionality, creating a lightweight proxy, etc.
* `stream` builds upon `streamBytes` and parses the response into JavaScript objects.
* `streamTokens` builds upon `stream` by returning a `ReadableStream` that consists only of the tokens from the LLM. This is convenient if all you care about is the LLM response text.

See the [Getting Started guide](/guides/models/getting-started.md) for more information about these methods.

## Streaming from your API endpoint

A common need is to stream an LLM response from your endpoint to clients. Axflow provides a utility, `StreamingJsonResponse`, that will transform your stream into a streaming HTTP response.

For example, consider the following endpoint at `/api/chat`:

```ts
import { OpenAIChat } from '@axflow/models/openai/chat';
import { StreamingJsonResponse } from '@axflow/models/shared';

export const runtime = 'edge';

// POST /api/chat
export async function POST(request: Request) {
  const { query } = await request.json();

  const stream = await OpenAIChat.streamTokens(
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: query }],
    },
    {
      apiKey: process.env.OPENAI_API_KEY,
    },
  );

  return new StreamingJsonResponse(stream);
}
```

A `StreamingJsonResponse` object is returned from the handler function which will stream each token from the LLM back to the client.

::: tip
For environments that use Node.js `ServerResponse` objects, like express.js, use the [`streamJsonResponse`](/documentation/models/node.md#streamjsonresponse) function from the `@axflow/models/node` subpath export.
:::

### Deconstructing the response

`StreamingJsonResponse` converts each chunk of the stream into [newline-delimited JSON](http://ndjson.org). Newline-delimited JSON is easy to extend, parse, and reason about.

Each line of JSON in the response uses the following schema:

```ts
type NdJsonValueType = {
  type: 'chunk' | 'data';
  value: JsonValueType; // any valid JSON value here
}
```

This means that each line is either a `chunk` type or a `data` type. When the type is `chunk`, the `value` contains chunks from the source stream passed to `StreamingJsonResponse` as its first argument. The `data` type is covered in [Streaming additional data](#streaming-additional-data).

Using the endpoint from the code example above, we can `curl` the url to see the raw HTTP response:

```shell
❯ curl -i 'http://localhost:3000/api/chat' --data-raw '{"query":"What are Large Language Models? Answer in one sentence."}'
HTTP/1.1 200 OK
content-type: application/x-ndjson; charset=utf-8
date: Mon, 04 Sep 2023 23:11:36 GMT
keep-alive: timeout=5
connection: close
transfer-encoding: chunked

{"type":"chunk","value":"Large"}
{"type":"chunk","value":" Language"}
{"type":"chunk","value":" Models"}
{"type":"chunk","value":" are"}
{"type":"chunk","value":" machine"}
{"type":"chunk","value":" learning"}
{"type":"chunk","value":" models"}
{"type":"chunk","value":" designed"}
{"type":"chunk","value":" for"}
{"type":"chunk","value":" tasks"}
{"type":"chunk","value":" that"}
{"type":"chunk","value":" involve"}
{"type":"chunk","value":" the"}
{"type":"chunk","value":" manipulation"}
{"type":"chunk","value":" and"}
{"type":"chunk","value":" generation"}
{"type":"chunk","value":" of"}
{"type":"chunk","value":" natural"}
{"type":"chunk","value":" language"}
{"type":"chunk","value":"."}
```

Note that the response has a `content-type` set to `application/x-ndjson; charset=utf-8`.

### Streaming additional data

There are times when you want your endpoint to respond with extra data in addition to the contents being streamed from the LLM. Axflow has a pattern for exactly this use case.

Recall the JSON schema from `StreamingJsonResponse`:

```ts
type NdJsonValueType = {
  type: 'chunk' | 'data';
  value: JsonValueType; // any valid JSON value here
}
```

When a response chunk has type `data`, it corresponds to any arbitrary data you want to inject into the response.

In the following example, we use Retrieval Augmented Generation to query the LLM and _stream both the retrieved documents and LLM response back to the client_.

```ts
// POST /api/chat
export async function POST(request: Request) {
  const { query } = await request.json();

  const documents = await vectorDatabase.documentsSimilarTo(query, {limit: 2});

  const stream = await OpenAIChat.streamTokens(
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: new RAGPrompt(query, documents) }],
    },
    {
      apiKey: process.env.OPENAI_API_KEY,
    },
  );

  return new StreamingJsonResponse(stream, { data: documents });
}
```

The response contains both the `data` (which in this case contains documents from a vector database) and each `chunk` from the LLM response.

```shell
❯ curl -i 'http://localhost:3000/api/chat' --data-raw '{"query":"<query>"}'
HTTP/1.1 200 OK
content-type: application/x-ndjson; charset=utf-8
date: Mon, 04 Sep 2023 23:11:36 GMT
keep-alive: timeout=5
connection: close
transfer-encoding: chunked

{"type":"data","value":<document>}
{"type":"data","value":<document>}
{"type":"chunk","value":"<token>"}
{"type":"chunk","value":" <token>"}
...
{"type":"chunk","value":"."}
```

### Asynchronously streaming additional data

You may have data you want to stream back in parallel to the LLM response. In this case, `StreamingJsonResponse` accepts a promise for the `data` option and will only close the stream once the promise is resolved and its value is sent back to the client.

```ts
// POST /api/chat
export async function POST(request: Request) {
  const { query, userId } = await request.json();

  // Do not await these, we will run them in parallel.
  const data = [
    database.getUser(userId),         // returns promise
    database.getNotifications(userId) // returns promise
  ]

  const stream = await OpenAIChat.streamTokens(
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: query }],
    },
    {
      apiKey: process.env.OPENAI_API_KEY,
    },
  );

  return new StreamingJsonResponse(stream, { data: Promise.all(data) });
}
```

Now, the response body will look like:

```
{"type":"chunk","value":"<token>"}
{"type":"chunk","value":" <token>"}
{"type":"chunk","value":" <token>"}
...
{"type":"data","value":<user>}
{"type":"data","value":<notifications>}
```

## Arbitrary schema

It's important to note that this pattern works for any data that can be serialized to JSON, not just string tokens. For example, I could stream the parsed JavaScript objects from OpenAI:

```ts
export async function POST(request: Request) {
  const { query } = await request.json();

  const objects = await OpenAIChat.stream(
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: query }],
    },
    {
      apiKey: process.env.OPENAI_API_KEY,
    },
  );

  return new StreamingJsonResponse(objects);
}
```

Now, the response body will look something like:

```
{"type":"chunk","value":{"id":"chatcmpl-6qE9x0hLViEWfRzBOTJDU7itwkPJn","object":"chat.completion.chunk","created":1692681841,"model":"gpt-4-0613","choices":[{"index":0,"delta":{"content":"Some"},"finish_reason":null}]}}
{"type":"chunk","value":{"id":"chatcmpl-7qE9x0hLViEWfRzBOTJDU7itwkPJn","object":"chat.completion.chunk","created":1692681841,"model":"gpt-4-0613","choices":[{"index":0,"delta":{"content":" LL"},"finish_reason":null}]}}
{"type":"chunk","value":{"id":"chatcmpl-8qE9x0hLViEWfRzBOTJDU7itwkPJn","object":"chat.completion.chunk","created":1692681841,"model":"gpt-4-0613","choices":[{"index":0,"delta":{"content":" M"},"finish_reason":null}]}}
...
{"type":"chunk","value":{"id":"chatcmpl-9qE9x0hLViEWfRzBOTJDU7itwkPJn","object":"chat.completion.chunk","created":1692681841,"model":"gpt-4-0613","choices":[{"index":0,"delta":{"content":" response"},"finish_reason":null}]}}
```

Here, the `value` field contains arbitrarily complex JSON. The schema is up to you!

## Consuming the stream

For clients, there are two primary ways to consume a response generated by `StreamingJsonResponse`:

1. React hooks provided by this library, e.g., `useChat`
2. Using `NdJsonStream.decode`

### React hooks

See [Building client applications](/guides/models/building-client-applications.md).

### NdJsonStream

Using the example API endpoint above, we can decode the stream:

```ts
import { NdJsonStream, StreamToIterable } from '@axflow/models/shared';

async function main() {
  const response = await fetch("/api/chat", { query: "<query>" });

  const stream = NdJsonStream.decode(response.body);

  for await (const chunk of StreamToIterable(stream)) {
    if (chunk.type === 'chunk') {
      // do something with chunk
    } else if (chunk.type === 'data') {
      // do something with extra data
    }
  }
}
```

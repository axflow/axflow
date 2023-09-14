# @axflow/models/node

Functions for working with objects from the Node standard library.

```ts
import {streamJsonResponse} from '@axflow/models/node';
```

## `streamJsonResponse`

This function enables pipeing chunks from a `ReadableStream` to a Node.js `ServerResponse` object. This is the Node.js standard library equivalent of [`StreamingJsonResponse`](/documentation/models/shared.md#streamingjsonresponse).

```ts
/**
 * Pipe a `ReadableStream` through a Node `ServerResponse` object. This is
 * useful in environments using the Node.js standard library, like express.
 *
 * Example:
 *
 *     // Express JS route
 *     app.post("/api/chat", async (req, res) => {
 *       const chatRequest = req.body;
 *
 *       const stream = await OpenAIChat.streamTokens(chatRequest, {
 *         apiKey: process.env.OPENAI_API_KEY,
 *       });
 *
 *       return streamJsonResponse(stream, res);
 *     });
 *
 * @param stream A readable stream of chunks to encode as newline-delimited JSON.
 * @param response A Node.js `ServerResponse` object to pipe `stream` to.
 * @param options
 * @param options.status HTTP response status.
 * @param options.headers HTTP response headers.
 * @param options.data Additional data to enqueue to the output stream. If data is a `Promise`, the stream will wait for it to resolve and enqueue its resolved values before closing.
 */
declare function streamJsonResponse(stream: ReadableStream, response: ServerResponse, options?: {
  headers?: Record<string, string>;
  status?: number;
  data?: JSONValueType[] | Promise<JSONValueType[]>;
}): Promise<void>;
```

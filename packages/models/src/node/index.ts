import { ServerResponse } from 'node:http';
import { NdJsonStream, StreamToIterable, type JSONValueType } from '@axflow/models/shared';

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
export async function streamJsonResponse(
  stream: ReadableStream,
  response: ServerResponse,
  options?: {
    headers?: Record<string, string>;
    status?: number;
    data?: JSONValueType[] | Promise<JSONValueType[]>;
  },
) {
  options ??= {};

  response.writeHead(options.status || 200, {
    ...options.headers,
    ...NdJsonStream.headers,
  });

  const ndJsonStream = NdJsonStream.encode(stream, {
    data: options.data,
  });

  for await (const chunk of StreamToIterable(ndJsonStream)) {
    response.write(chunk);
  }

  response.end();
}

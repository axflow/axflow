export function createFakeFetch(options: {
  status?: number;
  body?: ReadableStream<Uint8Array>;
  json?: object;
  text?: string;
  headers?: Record<string, string>;
}) {
  const status = options.status || 200;
  const headers = new Headers(options.headers || {});

  const fetch = jest.fn(async () => {
    return {
      ok: status >= 200 && status < 300,
      body: options.body,
      status: status,
      headers: headers,
      json() {
        return Promise.resolve(options.json);
      },
      text() {
        return Promise.resolve(options.text);
      },
    };
  });

  return fetch;
}

/**
 * Creates a ReadableStream of bytes from a blob of text.
 * The stream enqueues chunks of bytes of random lengths which
 * helps test the robustness of those consuming the stream.
 */
export function createUnpredictableByteStream(blob: string) {
  const bytes = new TextEncoder().encode(blob);
  const length = bytes.byteLength;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      let i = 0;

      while (i < length) {
        const randomChunkSize = Math.floor(Math.random() * 100);
        const chunkFrom = i;
        const chunkSize = Math.min(randomChunkSize, length - i);
        const chunk = bytes.slice(chunkFrom, chunkFrom + chunkSize);
        controller.enqueue(chunk);
        i += chunk.byteLength;
      }

      controller.close();
    },
  });
}

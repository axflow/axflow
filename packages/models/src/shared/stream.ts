import type { JSONValueType } from './types';

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
export function IterableToStream<T>(iterable: AsyncIterable<T>): ReadableStream<T> {
  // @ts-ignore
  if (typeof ReadableStream.from === 'function') {
    // @ts-ignore
    return ReadableStream.from(iterable);
  }

  const iterator = iterable[Symbol.asyncIterator]();

  return new ReadableStream<T>({
    async pull(controller) {
      const { done, value } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

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
export function StreamToIterable<T>(stream: ReadableStream<T>): AsyncIterable<T> {
  // @ts-ignore
  return stream[Symbol.asyncIterator] ? stream[Symbol.asyncIterator]() : createIterable(stream);
}

async function* createIterable<T>(stream: ReadableStream<T>): AsyncIterable<T> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export type NdJsonValueType = {
  type: 'chunk' | 'data';
  value: JSONValueType;
};

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
export class NdJsonStream {
  /**
   * These are the proper headers for newline-delimited JSON streams.
   *
   * @see http://ndjson.org
   */
  static headers = Object.freeze({ 'content-type': 'application/x-ndjson; charset=utf-8' });

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
    options?: { data?: JSONValueType[] | Promise<JSONValueType[]> },
  ): ReadableStream<Uint8Array> {
    const data = options?.data ?? [];
    const dataIsPromise = data instanceof Promise;

    const encoder = new TextEncoder();

    function serialize(obj: NdJsonValueType) {
      const serialized = JSON.stringify(obj);
      return encoder.encode(`${serialized}\n`);
    }

    const ndJsonEncode = new TransformStream({
      start(controller) {
        if (dataIsPromise) {
          return;
        }

        if (!Array.isArray(data)) {
          throw new Error(
            `Expected options.data to be an array of JSON-serializable objects but it was ${typeof data}`,
          );
        }

        for (const value of data) {
          controller.enqueue(serialize({ type: 'data', value }));
        }
      },

      async transform(value, controller) {
        controller.enqueue(serialize({ type: 'chunk', value }));
      },

      async flush(controller) {
        if (!dataIsPromise) {
          return;
        }

        const result = await Promise.resolve(data);

        if (!Array.isArray(result)) {
          throw new Error(
            `Expected options.data to resolve to an array of JSON-serializable objects but it was ${typeof result}`,
          );
        }

        for (const value of result) {
          controller.enqueue(serialize({ type: 'data', value }));
        }
      },
    });

    return stream.pipeThrough(ndJsonEncode);
  }

  /**
   * Transforms a stream of newline-delimited JSON to a stream of objects.
   *
   * @see http://ndjson.org
   *
   * @param stream A readable stream of newline-delimited JSON objects.
   * @returns A readable stream of objects.
   */
  static decode(stream: ReadableStream<Uint8Array>): ReadableStream<NdJsonValueType> {
    let buffer: string[] = [];
    const decoder = new TextDecoder();

    const parser = new TransformStream<Uint8Array, NdJsonValueType>({
      transform(bytes, controller) {
        const chunk = decoder.decode(bytes);

        for (let i = 0, len = chunk.length; i < len; ++i) {
          const isChunkSeparator = chunk[i] === '\n';

          // Keep buffering unless we've hit the end of a data chunk
          if (!isChunkSeparator) {
            buffer.push(chunk[i]);
            continue;
          }

          // ndjson supports '\r\n' as the delimiter. We did not add
          // the \n to the buffer, but may have added the \r if present
          const line = buffer.join('').trimEnd();

          controller.enqueue(JSON.parse(line));

          buffer = [];
        }
      },
    });

    return stream.pipeThrough(parser);
  }
}

/**
 * A subclass of `Response` that streams newline-delimited JSON.
 */
export class StreamingJsonResponse<T> extends Response {
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
    options?: ResponseInit & { data?: JSONValueType[] | Promise<JSONValueType[]> },
  ) {
    options ??= {};

    const ndjson = NdJsonStream.encode(stream, {
      data: options.data,
    });

    super(ndjson, {
      status: options.status,
      statusText: options.statusText,
      headers: { ...options.headers, ...NdJsonStream.headers },
    });
  }
}

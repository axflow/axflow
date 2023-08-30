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
 * @param stream A ReadableStream
 * @returns An AsyncIterable over the stream contents
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

type JSONValueType =
  | null
  | string
  | number
  | boolean
  | { [x: string]: JSONValueType }
  | Array<JSONValueType>;

export type NdJsonValueType = {
  type: 'chunk' | 'data';
  value: Record<string, JSONValueType>;
};

export class NdJsonStream {
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
   *
   * @param stream A readable stream of JSON-serializable chunks to encode as ndjson
   * @param options
   * @param options.data Additional data to prepend to the output stream
   * @returns A readable stream of newline-delimited JSON
   */
  static encode<T extends Record<string, JSONValueType>>(
    stream: ReadableStream<T>,
    options?: {
      data?: Record<string, JSONValueType>[];
    },
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();

    function serialize(obj: NdJsonValueType) {
      const serialized = JSON.stringify(obj);
      return encoder.encode(`${serialized}\n`);
    }

    const ndJsonEncode = new TransformStream({
      start(controller) {
        const data = options?.data || [];

        for (const value of data) {
          controller.enqueue(serialize({ type: 'data', value }));
        }
      },

      transform(value, controller) {
        controller.enqueue(serialize({ type: 'chunk', value }));
      },
    });

    return stream.pipeThrough(ndJsonEncode);
  }

  /**
   * Transforms a stream of newline-delimited JSON to a stream of objects.
   *
   * @param stream A readable stream of newline-delimited JSON objects
   * @returns A readable stream of objects
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

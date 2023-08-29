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

export class NdJsonStream {
  static headers = Object.freeze({ 'content-type': 'application/x-ndjson' });

  /**
   * Converts a stream of JSON-serializable objects to newline-delimited JSON.
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
   *     const ndJsonStream = NdJsonStream.from(stream);
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
   *     const ndJsonStream = NdJsonStream.from(stream, [{ extra: 'data' }]);
   *     const entries = [];
   *     for await (const chunk of stream) {
   *       entry.push(new TextDecoder().decode(chunk));
   *     }
   *     console.log(entries); // [ "{\"type\":\"data\",\"value\":{\"extra\":\"data\"}}\n", "{\"type\":\"chunk\",\"value\":{\"key\":\"value\"}}\n" ]
   *
   *
   * @param stream A readable stream of JSON-serializable chunks to encode as ndjson
   * @param data Optional, additional data to prepend to the output stream
   * @returns A readable stream of newline-delimited JSON
   */
  static from<T extends { [x: string]: JSONValueType }>(
    stream: ReadableStream<T>,
    data?: Record<string, JSONValueType> | Record<string, JSONValueType>[],
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();

    function serialize(obj: Record<string, JSONValueType>) {
      const serialized = JSON.stringify(obj);
      return encoder.encode(`${serialized}\n`);
    }

    const ndJsonEncode = new TransformStream({
      start(controller) {
        if (!data) {
          return;
        }

        for (const entry of Array.isArray(data) ? data : [data]) {
          controller.enqueue(serialize({ type: 'data', value: entry }));
        }
      },

      transform(chunk, controller) {
        controller.enqueue(serialize({ type: 'chunk', value: chunk }));
      },
    });

    return stream.pipeThrough(ndJsonEncode);
  }
}

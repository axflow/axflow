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

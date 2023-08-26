export type SharedRequestOptions = {
  apiKey?: string;
  apiUrl?: string;
  fetch?: typeof fetch;
};

export function headers(apiKey?: string) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
  };

  if (typeof apiKey === 'string') {
    headers.authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

export function streamTransformer<T>() {
  let buffer: string[] = [];
  const decoder = new TextDecoder();

  return (bytes: Uint8Array, controller: TransformStreamDefaultController<T>) => {
    const chunk = decoder.decode(bytes);

    for (let i = 0, len = chunk.length; i < len; ++i) {
      // OpenAI separates data lines with '\n\n'
      const isChunkSeparator = chunk[i] === '\n' && buffer[buffer.length - 1] === '\n';

      // Keep buffering unless we've hit the end of a data chunk
      if (!isChunkSeparator) {
        buffer.push(chunk[i]);
        continue;
      }

      const parsedChunk = parseChunk<T>(buffer.join(''));

      if (parsedChunk) {
        controller.enqueue(parsedChunk);
      }

      buffer = [];
    }
  };
}

const DATA_RE = /data:\s*(.+)/;

function parseChunk<T>(chunk: string): T | null {
  chunk = chunk.trim();

  if (chunk.length === 0) {
    return null;
  }

  const match = chunk.match(DATA_RE);

  try {
    const data = match![1];
    return data === '[DONE]' ? null : JSON.parse(data);
  } catch (error) {
    throw new Error(
      `Encountered unexpected chunk while parsing OpenAI streaming response: ${JSON.stringify(
        chunk,
      )}`,
    );
  }
}

import { StreamToIterable, NdJsonStream, StreamingJsonResponse } from '../../src/shared';
import type { NdJsonValueType } from '../../src/shared';
import { createUnpredictableByteStream } from '../utils';

describe('streams', () => {
  const chunks = [
    { content: 'A' },
    { content: ' Nd' },
    { content: 'Json' },
    { content: ' stream' },
  ];

  const decoder = new TextDecoder();

  let source: ReadableStream<{ content: string }>;

  beforeEach(() => {
    source = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
  });

  describe('NdJsonStream', () => {
    describe('.encode', () => {
      it('specifies headers', () => {
        expect(NdJsonStream.headers).toEqual({
          'content-type': 'application/x-ndjson; charset=utf-8',
        });
      });

      it('creates a special nd json formatted stream', async () => {
        let ndjson: string[] = [];

        const ndJsonStream = NdJsonStream.encode(source);

        for await (const chunk of StreamToIterable(ndJsonStream)) {
          ndjson.push(decoder.decode(chunk));
        }

        expect(ndjson).toEqual([
          '{"type":"chunk","value":{"content":"A"}}\n',
          '{"type":"chunk","value":{"content":" Nd"}}\n',
          '{"type":"chunk","value":{"content":"Json"}}\n',
          '{"type":"chunk","value":{"content":" stream"}}\n',
        ]);
      });

      it('supports additional data prepended to the stream', async () => {
        let ndjson: string[] = [];

        const additionalData = [
          { some: 'extra', data: 'here' },
          { some: 'more', data: 'here' },
        ];

        const ndJsonStream = NdJsonStream.encode(source, { data: additionalData });

        for await (const chunk of StreamToIterable(ndJsonStream)) {
          ndjson.push(decoder.decode(chunk));
        }

        expect(ndjson).toEqual([
          '{"type":"data","value":{"some":"extra","data":"here"}}\n',
          '{"type":"data","value":{"some":"more","data":"here"}}\n',
          '{"type":"chunk","value":{"content":"A"}}\n',
          '{"type":"chunk","value":{"content":" Nd"}}\n',
          '{"type":"chunk","value":{"content":"Json"}}\n',
          '{"type":"chunk","value":{"content":" stream"}}\n',
        ]);
      });

      it('can map the stream chunks', async () => {
        const ndJsonStream = NdJsonStream.encode(source, {
          map(chunk) {
            return chunk.content;
          },
        });

        let ndjson: string[] = [];

        for await (const chunk of StreamToIterable(ndJsonStream)) {
          ndjson.push(decoder.decode(chunk));
        }

        expect(ndjson).toEqual([
          '{"type":"chunk","value":"A"}\n',
          '{"type":"chunk","value":" Nd"}\n',
          '{"type":"chunk","value":"Json"}\n',
          '{"type":"chunk","value":" stream"}\n',
        ]);
      });

      it('can asynchronously map the stream chunks', async () => {
        function delay<T>(ms: number, value: T): Promise<T> {
          return new Promise((resolve) => {
            setTimeout(() => resolve(value), ms);
          });
        }

        const ndJsonStream = NdJsonStream.encode(source, {
          map(chunk) {
            return delay(1, chunk.content);
          },
        });

        let ndjson: string[] = [];

        for await (const chunk of StreamToIterable(ndJsonStream)) {
          ndjson.push(decoder.decode(chunk));
        }

        expect(ndjson).toEqual([
          '{"type":"chunk","value":"A"}\n',
          '{"type":"chunk","value":" Nd"}\n',
          '{"type":"chunk","value":"Json"}\n',
          '{"type":"chunk","value":" stream"}\n',
        ]);
      });
    });

    describe('.decode', () => {
      it('can decode an ndjson stream', async () => {
        const stream = createUnpredictableByteStream(
          [
            '{"type":"data","value":{"some":"extra","data":"here"}}\n',
            '{"type":"data","value":{"some":"more","data":"here"}}\n',
            '{"type":"chunk","value":{"content":"A"}}\n',
            '{"type":"chunk","value":{"content":" Nd"}}\n',
            '{"type":"chunk","value":{"content":"Json"}}\n',
            '{"type":"chunk","value":{"content":" stream"}}\n',
          ].join(''),
        );

        const results: NdJsonValueType[] = [];

        for await (const chunk of StreamToIterable(NdJsonStream.decode(stream))) {
          results.push(chunk);
        }

        expect(results).toEqual([
          { type: 'data', value: { some: 'extra', data: 'here' } },
          { type: 'data', value: { some: 'more', data: 'here' } },
          { type: 'chunk', value: { content: 'A' } },
          { type: 'chunk', value: { content: ' Nd' } },
          { type: 'chunk', value: { content: 'Json' } },
          { type: 'chunk', value: { content: ' stream' } },
        ]);
      });
    });
  });

  describe('StreamingJsonResponse', () => {
    it('can create a ndjson response', async () => {
      const response = new StreamingJsonResponse(source, {
        map(chunk) {
          return chunk.content;
        },
      });

      expect(response.ok).toBe(true);
      expect(response.status).toEqual(200);
      expect(response.headers.get('content-type')).toEqual('application/x-ndjson; charset=utf-8');

      let ndjson: string[] = [];

      for await (const chunk of StreamToIterable(response.body!)) {
        ndjson.push(decoder.decode(chunk));
      }

      expect(ndjson).toEqual([
        '{"type":"chunk","value":"A"}\n',
        '{"type":"chunk","value":" Nd"}\n',
        '{"type":"chunk","value":"Json"}\n',
        '{"type":"chunk","value":" stream"}\n',
      ]);
    });
  });
});

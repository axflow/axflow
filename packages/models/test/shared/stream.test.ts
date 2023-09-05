import {
  IterableToStream,
  StreamToIterable,
  NdJsonStream,
  StreamingJsonResponse,
} from '../../src/shared';
import type { NdJsonValueType } from '../../src/shared';
import { createUnpredictableByteStream } from '../utils';

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

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

      it('supports enqueueing additional data to the stream', async () => {
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

      it('supports asynchronously enqueueing additional data to the stream', async () => {
        let ndjson: string[] = [];

        const additionalData = delay(2, [
          { some: 'extra', data: 'here' },
          { some: 'more', data: 'here' },
        ]);

        const ndJsonStream = NdJsonStream.encode(source, { data: additionalData });

        for await (const chunk of StreamToIterable(ndJsonStream)) {
          ndjson.push(decoder.decode(chunk));
        }

        expect(ndjson).toEqual([
          '{"type":"chunk","value":{"content":"A"}}\n',
          '{"type":"chunk","value":{"content":" Nd"}}\n',
          '{"type":"chunk","value":{"content":"Json"}}\n',
          '{"type":"chunk","value":{"content":" stream"}}\n',
          '{"type":"data","value":{"some":"extra","data":"here"}}\n',
          '{"type":"data","value":{"some":"more","data":"here"}}\n',
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
      const response = new StreamingJsonResponse(source);

      expect(response.ok).toBe(true);
      expect(response.status).toEqual(200);
      expect(response.headers.get('content-type')).toEqual('application/x-ndjson; charset=utf-8');

      let ndjson: string[] = [];

      for await (const chunk of StreamToIterable(response.body!)) {
        ndjson.push(decoder.decode(chunk));
      }

      expect(ndjson).toEqual([
        '{"type":"chunk","value":{"content":"A"}}\n',
        '{"type":"chunk","value":{"content":" Nd"}}\n',
        '{"type":"chunk","value":{"content":"Json"}}\n',
        '{"type":"chunk","value":{"content":" stream"}}\n',
      ]);
    });

    it('can create a ndjson response with custom Response headers and status', async () => {
      const response = new StreamingJsonResponse(source, {
        status: 201,
        headers: {
          'x-my-custom-header': 'application/custom-header',
        },
      });

      expect(response.ok).toBe(true);
      expect(response.status).toEqual(201);
      expect(response.headers.get('content-type')).toEqual('application/x-ndjson; charset=utf-8');
      expect(response.headers.get('x-my-custom-header')).toEqual('application/custom-header');

      let ndjson: string[] = [];

      for await (const chunk of StreamToIterable(response.body!)) {
        ndjson.push(decoder.decode(chunk));
      }

      expect(ndjson).toEqual([
        '{"type":"chunk","value":{"content":"A"}}\n',
        '{"type":"chunk","value":{"content":" Nd"}}\n',
        '{"type":"chunk","value":{"content":"Json"}}\n',
        '{"type":"chunk","value":{"content":" stream"}}\n',
      ]);
    });

    it('can create a ndjson response with additional data', async () => {
      const additionalData = [
        { some: 'extra', data: 'here' },
        { some: 'more', data: 'here' },
      ];

      const response = new StreamingJsonResponse(source, {
        data: additionalData,
      });

      expect(response.ok).toBe(true);
      expect(response.status).toEqual(200);
      expect(response.headers.get('content-type')).toEqual('application/x-ndjson; charset=utf-8');

      let ndjson: string[] = [];

      for await (const chunk of StreamToIterable(response.body!)) {
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

    it('can create a ndjson response with async additional data', async () => {
      const additionalData = delay(2, [
        { some: 'extra', data: 'here' },
        { some: 'more', data: 'here' },
      ]);

      const response = new StreamingJsonResponse(source, {
        data: additionalData,
      });

      expect(response.ok).toBe(true);
      expect(response.status).toEqual(200);
      expect(response.headers.get('content-type')).toEqual('application/x-ndjson; charset=utf-8');

      let ndjson: string[] = [];

      for await (const chunk of StreamToIterable(response.body!)) {
        ndjson.push(decoder.decode(chunk));
      }

      expect(ndjson).toEqual([
        '{"type":"chunk","value":{"content":"A"}}\n',
        '{"type":"chunk","value":{"content":" Nd"}}\n',
        '{"type":"chunk","value":{"content":"Json"}}\n',
        '{"type":"chunk","value":{"content":" stream"}}\n',
        '{"type":"data","value":{"some":"extra","data":"here"}}\n',
        '{"type":"data","value":{"some":"more","data":"here"}}\n',
      ]);
    });
  });

  describe('IterableToStream', () => {
    it('can convert an async iterable to a readable stream', async () => {
      const iterable = (async function* () {
        for (const chunk of chunks) {
          yield delay(0, chunk);
        }
      })();

      const stream = IterableToStream(iterable);
      const reader = stream.getReader();

      let contents = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        contents += value.content;
      }

      expect(contents).toEqual('A NdJson stream');
    });
  });
});

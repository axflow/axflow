import { StreamToIterable, NdJsonStream, NdJsonValueType } from '../../src/utils';
import { createUnpredictableByteStream } from '../utils';

describe('NdJsonStream', () => {
  describe('.encode', () => {
    const chunks = [
      { content: 'A' },
      { content: ' Nd' },
      { content: 'Json' },
      { content: ' stream' },
    ];

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

    const decoder = new TextDecoder();

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
      let ndjson: string[] = [];

      const ndJsonStream = NdJsonStream.encode(source, {
        map(chunk) {
          return chunk.content;
        },
      });

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

  it('specifies headers', () => {
    expect(NdJsonStream.headers).toEqual({ 'content-type': 'application/x-ndjson; charset=utf-8' });
  });
});

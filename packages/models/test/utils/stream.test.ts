import { StreamToIterable, NdJsonStream } from '../../src/utils';

describe('NdJsonStream', () => {
  describe('.from', () => {
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

      const ndJsonStream = NdJsonStream.from(source);

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

      const ndJsonStream = NdJsonStream.from(source, additionalData);

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
  });

  it('specifies headers', () => {
    expect(NdJsonStream.headers).toEqual({ 'content-type': 'application/x-ndjson' });
  });
});

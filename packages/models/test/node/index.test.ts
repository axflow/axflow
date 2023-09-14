import { streamJsonResponse } from '../../src/node';
import { ServerResponse } from 'node:http';

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

function createMockResponse() {
  return {
    writeHead: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  } as any as ServerResponse;
}

describe('streamJsonResponse', () => {
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

  it('can stream an ndjson response through a Node ServerResponse', async () => {
    const response = createMockResponse();

    await streamJsonResponse(source, response);

    expect(response.writeHead).toHaveBeenCalledTimes(1);
    expect(response.writeHead).toHaveBeenCalledWith(200, {
      'content-type': 'application/x-ndjson; charset=utf-8',
    });

    const writeMock = response.write as jest.Mock;

    expect(writeMock).toHaveBeenCalledTimes(4);
    const ndjson = writeMock.mock.calls.map((args) => decoder.decode(args[0]));
    expect(ndjson).toEqual([
      '{"type":"chunk","value":{"content":"A"}}\n',
      '{"type":"chunk","value":{"content":" Nd"}}\n',
      '{"type":"chunk","value":{"content":"Json"}}\n',
      '{"type":"chunk","value":{"content":" stream"}}\n',
    ]);

    expect(response.end).toHaveBeenCalledTimes(1);
  });

  it('can stream an ndjson response through a Node ServerResponse with options', async () => {
    const response = createMockResponse();

    await streamJsonResponse(source, response, {
      status: 201,
      headers: { 'x-my-custom-header': 'application/custom-header' },
    });

    expect(response.writeHead).toHaveBeenCalledTimes(1);
    expect(response.writeHead).toHaveBeenCalledWith(201, {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'x-my-custom-header': 'application/custom-header',
    });

    const writeMock = response.write as jest.Mock;

    expect(writeMock).toHaveBeenCalledTimes(4);
    const ndjson = writeMock.mock.calls.map((args) => decoder.decode(args[0]));
    expect(ndjson).toEqual([
      '{"type":"chunk","value":{"content":"A"}}\n',
      '{"type":"chunk","value":{"content":" Nd"}}\n',
      '{"type":"chunk","value":{"content":"Json"}}\n',
      '{"type":"chunk","value":{"content":" stream"}}\n',
    ]);

    expect(response.end).toHaveBeenCalledTimes(1);
  });

  it('can stream an ndjson response through a Node ServerResponse with additional data', async () => {
    const response = createMockResponse();

    const additionalData = [
      { some: 'extra', data: 'here' },
      { some: 'more', data: 'here' },
    ];

    await streamJsonResponse(source, response, {
      data: additionalData,
    });

    expect(response.writeHead).toHaveBeenCalledTimes(1);
    expect(response.writeHead).toHaveBeenCalledWith(200, {
      'content-type': 'application/x-ndjson; charset=utf-8',
    });

    const writeMock = response.write as jest.Mock;

    expect(writeMock).toHaveBeenCalledTimes(6);
    const ndjson = writeMock.mock.calls.map((args) => decoder.decode(args[0]));
    expect(ndjson).toEqual([
      '{"type":"data","value":{"some":"extra","data":"here"}}\n',
      '{"type":"data","value":{"some":"more","data":"here"}}\n',
      '{"type":"chunk","value":{"content":"A"}}\n',
      '{"type":"chunk","value":{"content":" Nd"}}\n',
      '{"type":"chunk","value":{"content":"Json"}}\n',
      '{"type":"chunk","value":{"content":" stream"}}\n',
    ]);

    expect(response.end).toHaveBeenCalledTimes(1);
  });

  it('can stream an ndjson response through a Node ServerResponse with async additional data', async () => {
    const response = createMockResponse();

    const additionalData = delay(2, [
      { some: 'extra', data: 'here' },
      { some: 'more', data: 'here' },
    ]);

    await streamJsonResponse(source, response, {
      data: additionalData,
    });

    expect(response.writeHead).toHaveBeenCalledTimes(1);
    expect(response.writeHead).toHaveBeenCalledWith(200, {
      'content-type': 'application/x-ndjson; charset=utf-8',
    });

    const writeMock = response.write as jest.Mock;

    expect(writeMock).toHaveBeenCalledTimes(6);
    const ndjson = writeMock.mock.calls.map((args) => decoder.decode(args[0]));
    expect(ndjson).toEqual([
      '{"type":"chunk","value":{"content":"A"}}\n',
      '{"type":"chunk","value":{"content":" Nd"}}\n',
      '{"type":"chunk","value":{"content":"Json"}}\n',
      '{"type":"chunk","value":{"content":" stream"}}\n',
      '{"type":"data","value":{"some":"extra","data":"here"}}\n',
      '{"type":"data","value":{"some":"more","data":"here"}}\n',
    ]);

    expect(response.end).toHaveBeenCalledTimes(1);
  });
});

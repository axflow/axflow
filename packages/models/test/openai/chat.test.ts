import fs from 'node:fs/promises';
import Path from 'node:path';

import {
  createFakeFetch,
  createUnpredictableByteStream,
  NdJsonStreamToParsedObjects,
} from '../utils';
import { OpenAIChat, OpenAIChatTypes } from '../../src/openai/chat';
import { StreamToIterable, NdJsonStream } from '../../src/utils/stream';

describe('openai chat', () => {
  let streamingChatResponse: string;

  beforeAll(async () => {
    streamingChatResponse = await fs.readFile(Path.join(__dirname, 'streaming-chat-response.txt'), {
      encoding: 'utf8',
    });
  });

  describe('run', () => {
    it('executes a chat completion', async () => {
      const fetchSpy = createFakeFetch({
        json: {
          id: 'chatcmpl-7q9iFa9eplmD2n3hGPwJ6iBLlUQkY',
          object: 'chat.completion',
          created: 1692664747,
          model: 'gpt-4-0613',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content:
                  'The Eiffel Tower is a wrought-iron lattice tower located in Paris, France and is a globally recognised symbol.',
              },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 23, completion_tokens: 24, total_tokens: 47 },
        },
      });

      const response = await OpenAIChat.run(
        {
          model: 'gpt-4',
          messages: [
            { role: 'user', content: 'Using no more than 20 words, what is the Eiffel tower?' },
          ],
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      expect(response.choices[0].message).toEqual({
        role: 'assistant',
        content:
          'The Eiffel Tower is a wrought-iron lattice tower located in Paris, France and is a globally recognised symbol.',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer sk-not-real',
          'content-type': 'application/json',
        },
      });

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: 'Using no more than 20 words, what is the Eiffel tower?' },
        ],
        stream: false,
      });
    });
  });

  describe('stream', () => {
    it('executes a streaming chat completion', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingChatResponse),
      });

      const response = await OpenAIChat.stream(
        {
          model: 'gpt-4',
          messages: [
            { role: 'user', content: 'Using no more than 20 words, what is the Eiffel tower?' },
          ],
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        if (chunk.choices[0].finish_reason !== null) {
          continue;
        }

        resultingText += chunk.choices[0].delta.content;
      }

      expect(resultingText).toEqual(
        'The Eiffel Tower is a renowned wrought-iron landmark located in Paris, France, known globally as a symbol of romance and elegance.',
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer sk-not-real',
          'content-type': 'application/json',
        },
      });

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: 'Using no more than 20 words, what is the Eiffel tower?' },
        ],
        stream: true,
      });
    });

    it('can transform to ndjson', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingChatResponse),
      });

      const response = await OpenAIChat.stream(
        {
          model: 'gpt-4',
          messages: [
            { role: 'user', content: 'Using no more than 20 words, what is the Eiffel tower?' },
          ],
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      const stream = NdJsonStream.encode(response);

      let firstChunk: OpenAIChatTypes.Chunk | null = null;
      let lastChunk: OpenAIChatTypes.Chunk | null = null;

      for await (const entry of StreamToIterable(NdJsonStreamToParsedObjects(stream))) {
        if (!firstChunk) {
          firstChunk = entry.value as OpenAIChatTypes.Chunk;
        }

        lastChunk = entry.value as OpenAIChatTypes.Chunk;

        expect(entry).toMatchObject({
          type: 'chunk',
          value: expect.any(Object),
        });
      }

      expect(firstChunk).toEqual({
        choices: [
          {
            delta: {
              content: '',
              role: 'assistant',
            },
            finish_reason: null,
            index: 0,
          },
        ],
        created: 1692681841,
        id: 'chatcmpl-7qE9x0hLViEWfRzBOTJDU7itwkPJn',
        model: 'gpt-4-0613',
        object: 'chat.completion.chunk',
      });

      expect(lastChunk).toEqual({
        choices: [
          {
            delta: {},
            finish_reason: 'stop',
            index: 0,
          },
        ],
        created: 1692681841,
        id: 'chatcmpl-7qE9x0hLViEWfRzBOTJDU7itwkPJn',
        model: 'gpt-4-0613',
        object: 'chat.completion.chunk',
      });
    });
  });
});

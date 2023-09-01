import fs from 'node:fs/promises';
import Path from 'node:path';

import { createFakeFetch, createUnpredictableByteStream } from '../utils';
import { OpenAIChat } from '../../src/openai/chat';
import { StreamToIterable, NdJsonStream, StreamingJsonResponse } from '../../src/shared';
import type { NdJsonValueType } from '../../src/shared';

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

    it('can create a streaming json response', async () => {
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

      const stream = new StreamingJsonResponse(response, {
        data: [{ auxiliary: 'data' }],
        map: (chunk) => chunk.choices[0].delta.content || '',
      });

      const chunks: NdJsonValueType[] = [];

      for await (const chunk of StreamToIterable(NdJsonStream.decode(stream.body!))) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([
        { type: 'data', value: { auxiliary: 'data' } },
        { type: 'chunk', value: '' },
        { type: 'chunk', value: 'The' },
        { type: 'chunk', value: ' E' },
        { type: 'chunk', value: 'iff' },
        { type: 'chunk', value: 'el' },
        { type: 'chunk', value: ' Tower' },
        { type: 'chunk', value: ' is' },
        { type: 'chunk', value: ' a' },
        { type: 'chunk', value: ' renowned' },
        { type: 'chunk', value: ' wrought' },
        { type: 'chunk', value: '-' },
        { type: 'chunk', value: 'iron' },
        { type: 'chunk', value: ' landmark' },
        { type: 'chunk', value: ' located' },
        { type: 'chunk', value: ' in' },
        { type: 'chunk', value: ' Paris' },
        { type: 'chunk', value: ',' },
        { type: 'chunk', value: ' France' },
        { type: 'chunk', value: ',' },
        { type: 'chunk', value: ' known' },
        { type: 'chunk', value: ' globally' },
        { type: 'chunk', value: ' as' },
        { type: 'chunk', value: ' a' },
        { type: 'chunk', value: ' symbol' },
        { type: 'chunk', value: ' of' },
        { type: 'chunk', value: ' romance' },
        { type: 'chunk', value: ' and' },
        { type: 'chunk', value: ' elegance' },
        { type: 'chunk', value: '.' },
        { type: 'chunk', value: '' },
      ]);
    });
  });

  describe('streamTokens', () => {
    it('streams only the tokens', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingChatResponse),
      });

      const response = await OpenAIChat.streamTokens(
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
        resultingText += chunk;
      }

      expect(resultingText).toEqual(
        'The Eiffel Tower is a renowned wrought-iron landmark located in Paris, France, known globally as a symbol of romance and elegance.',
      );
    });
  });
});

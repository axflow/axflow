import fs from 'node:fs/promises';
import Path from 'node:path';

import { createFakeFetch, createUnpredictableByteStream } from '../utils';
import { OpenAICompletion } from '../../src/openai/completion';
import { StreamToIterable } from '../../src/shared';

describe('openai chat', () => {
  let streamingChatResponse: string;

  beforeAll(async () => {
    streamingChatResponse = await fs.readFile(
      Path.join(__dirname, 'streaming-completion-response.txt'),
      {
        encoding: 'utf8',
      },
    );
  });

  describe('run', () => {
    it('executes a chat completion', async () => {
      const fetchSpy = createFakeFetch({
        json: {
          id: 'cmpl-7qQ4UuIH02BRy3yAN71b8KeHxN19p',
          object: 'text_completion',
          created: 1692727630,
          model: 'text-davinci-003',
          choices: [
            {
              text: '\n\nTall wrought iron lattice tower in Paris, France, built by Gustave Eiffel in 1889.',
              index: 0,
              logprobs: null,
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 15, completion_tokens: 24, total_tokens: 39 },
        },
      });

      const response = await OpenAICompletion.run(
        {
          model: 'text-davinci-003',
          prompt: 'Using no more than 20 words, what is the Eiffel tower?',
          max_tokens: 256,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      expect(response.choices[0]).toEqual({
        text: '\n\nTall wrought iron lattice tower in Paris, France, built by Gustave Eiffel in 1889.',
        index: 0,
        logprobs: null,
        finish_reason: 'stop',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.openai.com/v1/completions', {
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
        model: 'text-davinci-003',
        prompt: 'Using no more than 20 words, what is the Eiffel tower?',
        max_tokens: 256,
        stream: false,
      });
    });

    it('can supply additional options', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        json: {
          id: 'cmpl-7qQ4UuIH02BRy3yAN71b8KeHxN19p',
          object: 'text_completion',
          created: 1692727630,
          model: 'text-davinci-003',
          choices: [
            {
              text: '\n\nTall wrought iron lattice tower in Paris, France, built by Gustave Eiffel in 1889.',
              index: 0,
              logprobs: null,
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 15, completion_tokens: 24, total_tokens: 39 },
        },
      });

      await OpenAICompletion.run(
        {
          model: 'text-davinci-003',
          prompt: 'Using no more than 20 words, what is the Eiffel tower?',
          max_tokens: 256,
        },
        {
          apiKey: 'sk-not-real',
          fetch: fetchSpy as any,
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.openai.com/v1/completions', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer sk-not-real',
          'content-type': 'application/json',
          'x-my-custom-header': 'custom-value',
        },
        signal: abortController.signal,
      });
    });
  });

  describe('stream', () => {
    it('executes a streaming chat completion', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingChatResponse),
      });

      const response = await OpenAICompletion.stream(
        {
          model: 'text-davinci-003',
          prompt: 'Using no more than 20 words, what is the Eiffel tower?',
          max_tokens: 256,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        if (chunk.choices[0].finish_reason !== null) {
          continue;
        }

        resultingText += chunk.choices[0].text;
      }

      expect(resultingText).toEqual(
        '\n\nIconic iron lattice tower in Paris, France, measuring 324 meters tall.',
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.openai.com/v1/completions', {
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
        model: 'text-davinci-003',
        prompt: 'Using no more than 20 words, what is the Eiffel tower?',
        max_tokens: 256,
        stream: true,
      });
    });

    it('can supply additional options', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingChatResponse),
      });

      await OpenAICompletion.stream(
        {
          model: 'text-davinci-003',
          prompt: 'Using no more than 20 words, what is the Eiffel tower?',
          max_tokens: 256,
        },
        {
          apiKey: 'sk-not-real',
          fetch: fetchSpy as any,
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.openai.com/v1/completions', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer sk-not-real',
          'content-type': 'application/json',
          'x-my-custom-header': 'custom-value',
        },
        signal: abortController.signal,
      });
    });
  });

  describe('streamTokens', () => {
    it('streams only the tokens', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingChatResponse),
      });

      const response = await OpenAICompletion.streamTokens(
        {
          model: 'text-davinci-003',
          prompt: 'Using no more than 20 words, what is the Eiffel tower?',
          max_tokens: 256,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        resultingText += chunk;
      }

      expect(resultingText).toEqual(
        '\n\nIconic iron lattice tower in Paris, France, measuring 324 meters tall.',
      );
    });
  });
});

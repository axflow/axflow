import fs from 'node:fs/promises';
import Path from 'node:path';

import { createFakeFetch, createUnpredictableByteStream } from '../utils';
import { AnthropicCompletion } from '../../src/anthropic/completion';
import { StreamToIterable } from '../../src/shared';

describe('anthropic completion', () => {
  let streamingCompletionResponse: string;

  beforeAll(async () => {
    streamingCompletionResponse = await fs.readFile(
      Path.join(__dirname, 'streaming-completion-response.txt'),
      {
        encoding: 'utf8',
      },
    );
  });

  describe('run', () => {
    it('executes a completion', async () => {
      const fetchSpy = createFakeFetch({
        json: {
          completion: ' Hello!',
          stop_reason: 'stop_sequence',
          model: 'claude-2.0',
          stop: '\n\nHuman:',
          log_id: 'bfd6321f190b5c6f55ca91cf2956f8b956654b7491af118ba18559d7c24a4684',
        },
      });

      const response = await AnthropicCompletion.run(
        {
          model: 'claude-2',
          prompt: '\n\nHuman: Hello, world!\n\nAssistant:',
          max_tokens_to_sample: 256,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      expect(response).toEqual({
        completion: ' Hello!',
        stop_reason: 'stop_sequence',
        model: 'claude-2.0',
        stop: '\n\nHuman:',
        log_id: 'bfd6321f190b5c6f55ca91cf2956f8b956654b7491af118ba18559d7c24a4684',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.anthropic.com/v1/complete', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          'x-api-key': 'sk-not-real',
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      });

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        model: 'claude-2',
        prompt: '\n\nHuman: Hello, world!\n\nAssistant:',
        max_tokens_to_sample: 256,
        stream: false,
      });
    });

    it('can supply additional options', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        json: {
          completion: ' Hello!',
          stop_reason: 'stop_sequence',
          model: 'claude-2.0',
          stop: '\n\nHuman:',
          log_id: 'bfd6321f190b5c6f55ca91cf2956f8b956654b7491af118ba18559d7c24a4684',
        },
      });

      await AnthropicCompletion.run(
        {
          model: 'claude-2',
          prompt: '\n\nHuman: Hello, world!\n\nAssistant:',
          max_tokens_to_sample: 256,
        },
        {
          apiKey: 'sk-not-real',
          fetch: fetchSpy as any,
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.anthropic.com/v1/complete', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          'x-api-key': 'sk-not-real',
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'x-my-custom-header': 'custom-value',
        },
        signal: abortController.signal,
      });
    });
  });

  describe('stream', () => {
    it('executes a streaming completion', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingCompletionResponse),
      });

      const response = await AnthropicCompletion.stream(
        {
          model: 'claude-2',
          prompt: '\n\nHuman: Hello, world!\n\nAssistant:',
          max_tokens_to_sample: 256,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        if (chunk.event !== 'completion') {
          continue;
        }

        resultingText += chunk.data.completion;
      }

      expect(resultingText).toEqual(' Hello!');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.anthropic.com/v1/complete', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          'x-api-key': 'sk-not-real',
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      });

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        model: 'claude-2',
        prompt: '\n\nHuman: Hello, world!\n\nAssistant:',
        max_tokens_to_sample: 256,
        stream: true,
      });
    });

    it('can supply additional options', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingCompletionResponse),
      });

      await AnthropicCompletion.stream(
        {
          model: 'claude-2',
          prompt: '\n\nHuman: Hello, world!\n\nAssistant:',
          max_tokens_to_sample: 256,
        },
        {
          apiKey: 'sk-not-real',
          fetch: fetchSpy as any,
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.anthropic.com/v1/complete', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          'x-api-key': 'sk-not-real',
          'anthropic-version': '2023-06-01',
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
        body: createUnpredictableByteStream(streamingCompletionResponse),
      });

      const response = await AnthropicCompletion.streamTokens(
        {
          model: 'claude-2',
          prompt: '\n\nHuman: Hello, world!\n\nAssistant:',
          max_tokens_to_sample: 256,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        resultingText += chunk;
      }

      expect(resultingText).toEqual(' Hello!');
    });
  });
});

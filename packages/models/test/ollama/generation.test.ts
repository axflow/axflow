import fs from 'node:fs/promises';
import Path from 'node:path';
import { OllamaGeneration } from '../../src/ollama/generation';
import { StreamToIterable } from '../../src/shared';
import { createFakeFetch, createUnpredictableByteStream } from '../utils';

describe('ollama generation task', () => {
  let streamingGenerationResponse: string;

  beforeAll(async () => {
    streamingGenerationResponse = await fs.readFile(
      Path.join(__dirname, 'streaming-response.txt'),
      { encoding: 'utf-8' },
    );
  });

  describe('stream', () => {
    it('executes a streaming completion', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingGenerationResponse),
      });

      const response = await OllamaGeneration.stream(
        {
          model: 'llama2',
          prompt: 'Write a haiku about TypeScript',
        },
        { fetch: fetchSpy as any, signal: abortController.signal },
      );

      let totalResp = '';
      for await (const chunk of StreamToIterable(response)) {
        // Don't append the last chunk's info, since it's aggregate stats
        // without a response token.
        if (!chunk.done) {
          totalResp += chunk.response;
        }
      }

      expect(totalResp).toEqual(` Sure! Here is a haiku about TypeScript:

TypeScript's embrace
Catches errors in bright light
Programmer's bliss`);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('http://127.0.0.1:11434/api/generate', {
        body: expect.any(String),
        method: 'POST',
        headers: {},
        signal: abortController.signal,
      });
      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        model: 'llama2',
        prompt: 'Write a haiku about TypeScript',
      });
    });
  });

  describe('streamTokens', () => {
    it('executes a streamTokens() properly)', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingGenerationResponse),
      });

      const response = await OllamaGeneration.streamTokens(
        {
          model: 'llama2',
          prompt: 'Write a haiku about TypeScript',
        },
        { fetch: fetchSpy as any, signal: abortController.signal },
      );
      let words = '';
      for await (const chunk of StreamToIterable(response)) {
        words += chunk;
      }

      expect(words).toEqual(` Sure! Here is a haiku about TypeScript:

TypeScript's embrace
Catches errors in bright light
Programmer's bliss`);

      expect(fetchSpy).toHaveBeenCalledTimes(1);

      expect(fetchSpy).toHaveBeenCalledWith('http://127.0.0.1:11434/api/generate', {
        body: expect.any(String),
        method: 'POST',
        headers: {},
        signal: abortController.signal,
      });
      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        model: 'llama2',
        prompt: 'Write a haiku about TypeScript',
      });
    });
  });
});

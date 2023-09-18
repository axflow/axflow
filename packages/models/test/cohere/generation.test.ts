import fs from 'node:fs/promises';
import Path from 'node:path';

import { createFakeFetch, createUnpredictableByteStream } from '../utils';
import { CohereGeneration } from '../../src/cohere/generation';
import { StreamToIterable } from '../../src/shared';

describe('cohere generation', () => {
  let streamingGenerationResponse: string;

  beforeAll(async () => {
    streamingGenerationResponse = await fs.readFile(
      Path.join(__dirname, 'streaming-generation-response.txt'),
      {
        encoding: 'utf8',
      },
    );
  });

  describe('run', () => {
    it('executes a generation', async () => {
      const fetchSpy = createFakeFetch({
        json: {
          id: 'a427751b-776f-49a8-b078-3b36acd206d1',
          generations: [
            {
              id: '9286db4a-c632-4a43-b9c0-c236bb3a82d5',
              text: ' LLMs, or large language models, are artificial intelligence models that are designed to perform language-based tasks such as generating text, answering questions, and performing language-related analyses. They are trained on massive amounts of text data, which helps them learn to understand and generate language in a way that is similar to how humans do it.',
            },
          ],
          prompt: 'Please explain to me how LLMs work in two sentences or less',
          meta: { api_version: { version: '1' } },
        },
      });

      const response = await CohereGeneration.run(
        {
          prompt: 'Please explain to me how LLMs work in two sentences or less',
          max_tokens: 80,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      expect(response).toEqual({
        id: 'a427751b-776f-49a8-b078-3b36acd206d1',
        generations: [
          {
            id: '9286db4a-c632-4a43-b9c0-c236bb3a82d5',
            text: ' LLMs, or large language models, are artificial intelligence models that are designed to perform language-based tasks such as generating text, answering questions, and performing language-related analyses. They are trained on massive amounts of text data, which helps them learn to understand and generate language in a way that is similar to how humans do it.',
          },
        ],
        prompt: 'Please explain to me how LLMs work in two sentences or less',
        meta: { api_version: { version: '1' } },
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.cohere.ai/v1/generate', {
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
        prompt: 'Please explain to me how LLMs work in two sentences or less',
        max_tokens: 80,
        stream: false,
      });
    });

    it('can supply additional options', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        json: {
          id: 'a427751b-776f-49a8-b078-3b36acd206d1',
          generations: [
            {
              id: '9286db4a-c632-4a43-b9c0-c236bb3a82d5',
              text: ' LLMs, or large language models, are artificial intelligence models that are designed to perform language-based tasks such as generating text, answering questions, and performing language-related analyses. They are trained on massive amounts of text data, which helps them learn to understand and generate language in a way that is similar to how humans do it.',
            },
          ],
          prompt: 'Please explain to me how LLMs work in two sentences or less',
          meta: { api_version: { version: '1' } },
        },
      });

      await CohereGeneration.run(
        {
          prompt: 'Please explain to me how LLMs work in two sentences or less',
          max_tokens: 80,
        },
        {
          apiKey: 'sk-not-real',
          fetch: fetchSpy as any,
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.cohere.ai/v1/generate', {
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
    it('executes a streaming completion', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingGenerationResponse),
      });

      const response = await CohereGeneration.stream(
        {
          prompt: 'Please explain to me how LLMs work in two sentences or less',
          max_tokens: 80,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        if (chunk.is_finished !== true) {
          resultingText += chunk.text;
        }
      }

      expect(resultingText).toEqual(
        ' LLMs work by using a large amount of data to train a model that can then be used to generate text. The model is trained to predict the next word in a sequence based on the words that came before it.',
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.cohere.ai/v1/generate', {
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
        prompt: 'Please explain to me how LLMs work in two sentences or less',
        max_tokens: 80,
        stream: true,
      });
    });

    it('can supply additional options', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingGenerationResponse),
      });

      await CohereGeneration.stream(
        {
          prompt: 'Please explain to me how LLMs work in two sentences or less',
          max_tokens: 80,
        },
        {
          apiKey: 'sk-not-real',
          fetch: fetchSpy as any,
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.cohere.ai/v1/generate', {
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
        body: createUnpredictableByteStream(streamingGenerationResponse),
      });

      const response = await CohereGeneration.streamTokens(
        {
          prompt: 'Please explain to me how LLMs work in two sentences or less',
          max_tokens: 80,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        resultingText += chunk;
      }

      expect(resultingText).toEqual(
        ' LLMs work by using a large amount of data to train a model that can then be used to generate text. The model is trained to predict the next word in a sequence based on the words that came before it.',
      );
    });
  });
});

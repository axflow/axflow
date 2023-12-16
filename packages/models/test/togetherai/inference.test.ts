import fs from 'node:fs/promises';
import Path from 'node:path';

import { createFakeFetch, createUnpredictableByteStream } from '../utils';
import { TogetherAIInference } from '../../src/togetherai/inference';
import { StreamToIterable } from '../../src/shared';

describe('togetherai inference', () => {
  let streamingInferenceResponse: string;

  beforeAll(async () => {
    streamingInferenceResponse = await fs.readFile(
      Path.join(__dirname, 'streaming-inference-response.txt'),
      {
        encoding: 'utf8',
      },
    );
  });

  describe('run', () => {
    it('executes a chat completion', async () => {
      const fetchSpy = createFakeFetch({
        json: {
          id: '835be4714e021739-SJC',
          status: 'finished',
          prompt: ['[INST] Using no more than 20 words, what is the Eiffel tower? [/INST] '],
          model: 'togethercomputer/llama-2-70b-chat',
          model_owner: '',
          num_returns: 1,
          args: {
            model: 'togethercomputer/llama-2-70b-chat',
            prompt: '[INST] Using no more than 20 words, what is the Eiffel tower? [/INST] ',
            max_tokens: 250,
            stream_tokens: false,
          },
          subjobs: [],
          output: {
            usage: {
              prompt_tokens: 26,
              completion_tokens: 30,
              total_tokens: 56,
            },
            result_type: 'language-model-inference',
            choices: [
              {
                text: "The Eiffel Tower is a famous iron lattice tower in Paris, France, built for the 1889 World's Fair.",
              },
            ],
          },
        },
      });

      const response = await TogetherAIInference.run(
        {
          model: 'togethercomputer/llama-2-70b-chat',
          prompt: '[INST] Using no more than 20 words, what is the Eiffel tower? [/INST] ',
          max_tokens: 250,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      expect(response.output.choices[0]).toEqual({
        text: "The Eiffel Tower is a famous iron lattice tower in Paris, France, built for the 1889 World's Fair.",
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.together.xyz/inference', {
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
        model: 'togethercomputer/llama-2-70b-chat',
        prompt: '[INST] Using no more than 20 words, what is the Eiffel tower? [/INST] ',
        max_tokens: 250,
        stream_tokens: false,
      });
    });
  });

  describe('stream', () => {
    it('executes a streaming chat completion', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingInferenceResponse),
      });

      const response = await TogetherAIInference.stream(
        {
          model: 'togethercomputer/llama-2-70b-chat',
          prompt: '[INST] Using no more than 20 words, what is the Eiffel tower? [/INST] ',
          max_tokens: 250,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        if (chunk.choices[0].text === '</s>') {
          continue;
        }

        resultingText += chunk.choices[0].text;
      }

      expect(resultingText).toEqual(
        " The Eiffel Tower is a famous iron lattice tower in Paris, France, built for the 1889 World's Fair.",
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.together.xyz/inference', {
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
        model: 'togethercomputer/llama-2-70b-chat',
        prompt: '[INST] Using no more than 20 words, what is the Eiffel tower? [/INST] ',
        max_tokens: 250,
        stream_tokens: true,
      });
    });
  });

  describe('streamTokens', () => {
    it('streams only the tokens', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingInferenceResponse),
      });

      const response = await TogetherAIInference.streamTokens(
        {
          model: 'togethercomputer/llama-2-70b-chat',
          prompt: '[INST] Using no more than 20 words, what is the Eiffel tower? [/INST] ',
          max_tokens: 250,
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const token of StreamToIterable(response)) {
        if (token === '</s>') {
          continue;
        }

        resultingText += token;
      }

      expect(resultingText).toEqual(
        " The Eiffel Tower is a famous iron lattice tower in Paris, France, built for the 1889 World's Fair.",
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.together.xyz/inference', {
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
        model: 'togethercomputer/llama-2-70b-chat',
        prompt: '[INST] Using no more than 20 words, what is the Eiffel tower? [/INST] ',
        max_tokens: 250,
        stream_tokens: true,
      });
    });
  });
});

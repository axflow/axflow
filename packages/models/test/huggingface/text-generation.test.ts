import fs from 'node:fs/promises';
import Path from 'node:path';
import { HuggingFaceTextGeneration } from '../../src/huggingface/text-generation';
import { StreamToIterable } from '../../src/shared';
import { createFakeFetch, createUnpredictableByteStream } from '../utils';

describe('huggingface textGeneration task', () => {
  let streamingGenerationResponse: string;
  let streamingGenerationResponseWithEndToken: string;

  beforeAll(async () => {
    streamingGenerationResponse = await fs.readFile(
      Path.join(__dirname, 'streaming-text-generation-response.txt'),
      { encoding: 'utf-8' },
    );
    streamingGenerationResponseWithEndToken = await fs.readFile(
      Path.join(__dirname, 'terminated-streaming-generation-response.txt'),
      { encoding: 'utf-8' },
    );
  });

  describe('run', () => {
    it('executes a generation', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        json: [
          {
            generated_text:
              'Whats the best way to make a chicken pesto dish?\n' +
              '\n' +
              "I've been making pesto for a while now, and I've always had a great time. I've always had a great time with it, and I've always had",
          },
        ],
      });
      const response = await HuggingFaceTextGeneration.run(
        {
          model: 'gpt2',
          inputs: 'Whats the best way to make a chicken pesto dish?',
          parameters: {
            temperature: 0.1,
          },
        },
        {
          apiKey: 'hf_not-real',
          fetch: fetchSpy as any,
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );
      expect(response).toEqual([
        {
          generated_text:
            'Whats the best way to make a chicken pesto dish?\n' +
            '\n' +
            "I've been making pesto for a while now, and I've always had a great time. I've always had a great time with it, and I've always had",
        },
      ]);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api-inference.huggingface.co/models/gpt2', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer hf_not-real',
          'x-my-custom-header': 'custom-value',
          'content-type': 'application/json',
        },
        signal: abortController.signal,
      });

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        inputs: 'Whats the best way to make a chicken pesto dish?',
        model: 'gpt2',
        parameters: {
          temperature: 0.1,
        },
        stream: false,
      });
    });
  });

  describe('stream', () => {
    it('executes a streaming completion', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingGenerationResponse),
      });

      const response = await HuggingFaceTextGeneration.stream(
        {
          model: 'google/flan-t5-xxl',
          inputs: 'Whats the best way to make a chicken pesto dish?',
          options: {
            wait_for_model: true,
          },
          parameters: {
            temperature: 0.1,
          },
        },
        { apiKey: 'hf_123', fetch: fetchSpy as any, signal: abortController.signal },
      );

      let totalResp = '';
      for await (const chunk of StreamToIterable(response)) {
        totalResp += chunk.token.text;
      }

      expect(totalResp).toEqual(' Toss a pound of chicken breasts with a cup of pesto, ');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api-inference.huggingface.co/models/google/flan-t5-xxl',
        {
          body: expect.any(String),
          method: 'POST',
          headers: {
            accept: 'application/json',
            authorization: 'Bearer hf_123',
            'content-type': 'application/json',
          },
          signal: abortController.signal,
        },
      );
      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        model: 'google/flan-t5-xxl',
        inputs: 'Whats the best way to make a chicken pesto dish?',
        options: {
          wait_for_model: true,
        },
        parameters: {
          temperature: 0.1,
        },
        stream: true,
      });
    });
  });

  it('executes a streaming completion with a stop token </s>', async () => {
    const fetchSpy = createFakeFetch({
      body: createUnpredictableByteStream(streamingGenerationResponseWithEndToken),
    });

    const response = await HuggingFaceTextGeneration.stream(
      {
        model: 'meta/llama-7b',
        inputs: 'Write a short haiku. Only respond with the Haiku, nothing else.',
        options: {
          wait_for_model: true,
        },
        parameters: {
          max_new_tokens: 250,
        },
      },
      {
        apiKey: 'hf_123',
        fetch: fetchSpy as any,
        apiUrl: 'https://custom.api.endpoint',
        headers: { 'x-my-custom-header': 'custom-value' },
      },
    );

    let totalResp = '';
    for await (const chunk of StreamToIterable(response)) {
      totalResp += chunk.token.text;
    }

    expect(totalResp).toEqual(
      '\nThe sun sets slowly\nGolden hues upon the sea\nPeaceful evening skyy</s>',
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('https://custom.api.endpoint', {
      body: expect.any(String),
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: 'Bearer hf_123',
        'x-my-custom-header': 'custom-value',
        'content-type': 'application/json',
      },
    });
    const args = fetchSpy.mock.lastCall as any;
    const bodyArgument = JSON.parse(args[1].body);

    expect(bodyArgument).toEqual({
      model: 'meta/llama-7b',
      inputs: 'Write a short haiku. Only respond with the Haiku, nothing else.',
      options: {
        wait_for_model: true,
      },
      parameters: {
        max_new_tokens: 250,
      },
      stream: true,
    });
  });

  describe('streamTokens', () => {
    it('executes a streamTokens() properly)', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingGenerationResponse),
      });

      const response = await HuggingFaceTextGeneration.streamTokens(
        {
          model: 'google/flan-t5-xxl',
          inputs: 'Whats the best way to make a chicken pesto dish?',
        },
        { apiKey: 'hf_nope', fetch: fetchSpy as any },
      );
      let words = '';
      for await (const chunk of StreamToIterable(response)) {
        words += chunk;
      }

      expect(words).toEqual(' Toss a pound of chicken breasts with a cup of pesto, ');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api-inference.huggingface.co/models/google/flan-t5-xxl',
        {
          body: expect.any(String),
          method: 'POST',
          headers: {
            accept: 'application/json',
            authorization: 'Bearer hf_nope',
            'content-type': 'application/json',
          },
        },
      );
      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        model: 'google/flan-t5-xxl',
        inputs: 'Whats the best way to make a chicken pesto dish?',
        stream: true,
      });
    });

    it('executes a streamTokens() completion with a stop token </s> without passing it back', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingGenerationResponseWithEndToken),
      });

      const response = await HuggingFaceTextGeneration.streamTokens(
        {
          model: 'meta/llama-7b',
          inputs: 'Write a short haiku. Only respond with the Haiku, nothing else.',
          options: {
            wait_for_model: true,
          },
          parameters: {
            max_new_tokens: 250,
          },
        },
        { apiKey: 'hf_123', fetch: fetchSpy as any, apiUrl: 'https://custom.api.endpoint' },
      );

      let totalResp = '';
      for await (const chunk of StreamToIterable(response)) {
        totalResp += chunk;
      }

      expect(totalResp).toEqual(
        '\nThe sun sets slowly\nGolden hues upon the sea\nPeaceful evening sky',
      );
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://custom.api.endpoint', {
        body: expect.any(String),
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer hf_123',
          'content-type': 'application/json',
        },
      });
      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        model: 'meta/llama-7b',
        inputs: 'Write a short haiku. Only respond with the Haiku, nothing else.',
        options: {
          wait_for_model: true,
        },
        parameters: {
          max_new_tokens: 250,
        },
        stream: true,
      });
    });
  });
});

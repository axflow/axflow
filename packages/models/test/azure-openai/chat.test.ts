import fs from 'node:fs/promises';
import Path from 'node:path';

import { createFakeFetch, createUnpredictableByteStream } from '../utils';
import { AzureOpenAIChat } from '../../src/azure-openai/chat';
import { StreamToIterable } from '../../src/shared';

describe('azure openai chat', () => {
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
          id: 'chatcmpl-866FNLpOvop5upgarCzkZ1kHJoJGU',
          object: 'chat.completion',
          created: 1696464673,
          model: 'gpt-4',
          prompt_filter_results: [{ prompt_index: 0, content_filter_results: [Object] }],
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: { role: 'assistant', content: 'Blue as my ice, homie.' },
              content_filter_results: {
                hate: { filtered: false, severity: 'safe' },
                self_harm: { filtered: false, severity: 'safe' },
                sexual: { filtered: false, severity: 'safe' },
                violence: { filtered: false, severity: 'safe' },
              },
            },
          ],
          usage: { completion_tokens: 59, prompt_tokens: 33, total_tokens: 92 },
        },
      });

      const response = await AzureOpenAIChat.run(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a hip hop artist. Answer questions in a cool style, but very concisely.',
            },
            {
              role: 'user',
              content: 'what color is the sky?',
            },
          ],
        },
        {
          apiKey: 'fake-azure',
          apiUrl: { resourceName: 'resource', deploymentId: 'deployment' },
          fetch: fetchSpy as any,
        },
      );

      expect(response.choices[0].message).toEqual({
        role: 'assistant',
        content: 'Blue as my ice, homie.',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://resource.openai.azure.com/openai/deployments/deployment/chat/completions?api-version=2023-08-01-preview',
        {
          body: expect.any(String),
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': 'fake-azure',
            'content-type': 'application/json',
          },
        },
      );

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        messages: [
          {
            role: 'system',
            content:
              'You are a hip hop artist. Answer questions in a cool style, but very concisely.',
          },
          {
            role: 'user',
            content: 'what color is the sky?',
          },
        ],
        stream: false,
      });
      expect(streamingChatResponse).toBeTruthy();
    });

    it('can supply additional options', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        json: {
          id: 'chatcmpl-866FNLpOvop5upgarCzkZ1kHJoJGU',
          object: 'chat.completion',
          created: 1696464673,
          model: 'gpt-4',
          prompt_filter_results: [{ prompt_index: 0, content_filter_results: [Object] }],
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: { role: 'assistant', content: 'Blue as my ice, homie.' },
              content_filter_results: {
                hate: { filtered: false, severity: 'safe' },
                self_harm: { filtered: false, severity: 'safe' },
                sexual: { filtered: false, severity: 'safe' },
                violence: { filtered: false, severity: 'safe' },
              },
            },
          ],
          usage: { completion_tokens: 59, prompt_tokens: 33, total_tokens: 92 },
        },
      });

      await AzureOpenAIChat.run(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a hip hop artist. Answer questions in a cool style, but very concisely.',
            },
            {
              role: 'user',
              content: 'what color is the sky?',
            },
          ],
        },
        {
          apiKey: 'fake-azure',
          fetch: fetchSpy as any,
          apiUrl: { resourceName: 'resource', deploymentId: 'deployment' },
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://resource.openai.azure.com/openai/deployments/deployment/chat/completions?api-version=2023-08-01-preview',
        {
          body: expect.any(String),
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': 'fake-azure',
            'content-type': 'application/json',
            'x-my-custom-header': 'custom-value',
          },
          signal: abortController.signal,
        },
      );
    });
  });

  describe('stream', () => {
    it('executes a streaming chat completion', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingChatResponse),
      });

      const response = await AzureOpenAIChat.stream(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a hip hop artist. Answer questions in a cool style, but very concisely.',
            },
            {
              role: 'user',
              content: 'what color is the sky?',
            },
          ],
        },
        {
          apiKey: 'fake-azure',
          apiUrl: { resourceName: 'resource', deploymentId: 'deployment' },
          fetch: fetchSpy as any,
        },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        if (chunk.choices.length === 0) {
          continue;
        }

        if (chunk.choices[0].finish_reason !== null) {
          continue;
        }

        if (!chunk.choices[0].delta.content) {
          continue;
        }

        resultingText += chunk.choices[0].delta.content;
      }

      expect(resultingText).toEqual(
        `Yo, the sky be rockin' that cool blue hue, 'less it's vibin' with a sunset then it's a mix of pink and orange, feel me? It changes its tone, playa, like a chameleon on a fresh graffiti wall.`,
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://resource.openai.azure.com/openai/deployments/deployment/chat/completions?api-version=2023-08-01-preview',
        {
          body: expect.any(String),
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': 'fake-azure',
            'content-type': 'application/json',
          },
        },
      );

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        messages: [
          {
            role: 'system',
            content:
              'You are a hip hop artist. Answer questions in a cool style, but very concisely.',
          },
          {
            role: 'user',
            content: 'what color is the sky?',
          },
        ],
        stream: true,
      });
    });

    it('can supply additional options', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingChatResponse),
      });

      await AzureOpenAIChat.stream(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a hip hop artist. Answer questions in a cool style, but very concisely.',
            },
            {
              role: 'user',
              content: 'what color is the sky?',
            },
          ],
        },
        {
          apiKey: 'fake-azure',
          apiUrl: { resourceName: 'resource', deploymentId: 'deployment' },
          fetch: fetchSpy as any,
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://resource.openai.azure.com/openai/deployments/deployment/chat/completions?api-version=2023-08-01-preview',
        {
          body: expect.any(String),
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': 'fake-azure',
            'content-type': 'application/json',
            'x-my-custom-header': 'custom-value',
          },
          signal: abortController.signal,
        },
      );
    });
  });

  describe('streamTokens', () => {
    it('streams only the tokens', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingChatResponse),
      });

      const response = await AzureOpenAIChat.streamTokens(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a hip hop artist. Answer questions in a cool style, but very concisely.',
            },
            {
              role: 'user',
              content: 'what color is the sky?',
            },
          ],
        },
        {
          apiKey: 'fake-azure',
          apiUrl: { resourceName: 'resource', deploymentId: 'deployment' },
          fetch: fetchSpy as any,
        },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        resultingText += chunk;
      }

      expect(resultingText).toEqual(
        `Yo, the sky be rockin' that cool blue hue, 'less it's vibin' with a sunset then it's a mix of pink and orange, feel me? It changes its tone, playa, like a chameleon on a fresh graffiti wall.`,
      );
    });
  });
});

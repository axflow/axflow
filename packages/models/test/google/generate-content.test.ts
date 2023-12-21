import fs from 'node:fs/promises';
import Path from 'node:path';

import { createFakeFetch, createUnpredictableByteStream } from '../utils';
import { GoogleGenerateContent } from '../../src/google/generate-content';
import { StreamToIterable } from '../../src/shared';

describe('google generateContent', () => {
  let streamingInferenceResponse: string;

  beforeAll(async () => {
    streamingInferenceResponse = await fs.readFile(
      Path.join(__dirname, 'stream-generate-content-response.txt'),
      {
        encoding: 'utf8',
      },
    );
  });

  describe('run', () => {
    it('executes a chat completion', async () => {
      const fetchSpy = createFakeFetch({
        json: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: "The little girl's magic backpack could fit anything she wanted, but she never realized until she accidentally packed the whole playground. Once she got to school, she opened it and out popped the slide, sandbox, swings, and even the monkey bars.",
                  },
                ],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
              safetyRatings: [
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', probability: 'NEGLIGIBLE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', probability: 'NEGLIGIBLE' },
                { category: 'HARM_CATEGORY_HARASSMENT', probability: 'NEGLIGIBLE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', probability: 'NEGLIGIBLE' },
              ],
            },
          ],
          promptFeedback: {
            safetyRatings: [
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', probability: 'NEGLIGIBLE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', probability: 'NEGLIGIBLE' },
              { category: 'HARM_CATEGORY_HARASSMENT', probability: 'NEGLIGIBLE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', probability: 'NEGLIGIBLE' },
            ],
          },
        },
      });

      const response = await GoogleGenerateContent.run(
        {
          model: 'gemini-pro',
          contents: [
            {
              parts: [
                {
                  text: 'Write a two sentence story about a magic backpack',
                },
              ],
            },
          ],
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      expect(response.candidates[0].content).toEqual({
        role: 'model',
        parts: [
          {
            text: "The little girl's magic backpack could fit anything she wanted, but she never realized until she accidentally packed the whole playground. Once she got to school, she opened it and out popped the slide, sandbox, swings, and even the monkey bars.",
          },
        ],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=sk-not-real',
        {
          body: expect.any(String),
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
        },
      );

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        contents: [
          {
            parts: [
              {
                text: 'Write a two sentence story about a magic backpack',
              },
            ],
          },
        ],
      });
    });
  });

  describe('stream', () => {
    it('executes a streaming chat completion', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingInferenceResponse),
      });

      const response = await GoogleGenerateContent.stream(
        {
          model: 'gemini-pro',
          contents: [
            {
              parts: [
                {
                  text: 'Write a two sentence story about a magic backpack',
                },
              ],
            },
          ],
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        resultingText += chunk.candidates[0].content.parts[0].text;
      }

      expect(resultingText).toEqual(
        'Emily opened her magical backpack and discovered a world of wonders, from talking animals to flying fairies, all waiting to embark on exciting adventures with her.',
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1/models/gemini-pro:streamGenerateContent?key=sk-not-real&alt=sse',
        {
          body: expect.any(String),
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
        },
      );

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        contents: [
          {
            parts: [
              {
                text: 'Write a two sentence story about a magic backpack',
              },
            ],
          },
        ],
      });
    });
  });

  describe('streamTokens', () => {
    it('streams only the tokens', async () => {
      const fetchSpy = createFakeFetch({
        body: createUnpredictableByteStream(streamingInferenceResponse),
      });

      const response = await GoogleGenerateContent.streamTokens(
        {
          model: 'gemini-pro',
          contents: [
            {
              parts: [
                {
                  text: 'Write a two sentence story about a magic backpack',
                },
              ],
            },
          ],
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      let resultingText = '';

      for await (const chunk of StreamToIterable(response)) {
        resultingText += chunk;
      }

      expect(resultingText).toEqual(
        'Emily opened her magical backpack and discovered a world of wonders, from talking animals to flying fairies, all waiting to embark on exciting adventures with her.',
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1/models/gemini-pro:streamGenerateContent?key=sk-not-real&alt=sse',
        {
          body: expect.any(String),
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
        },
      );

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({
        contents: [
          {
            parts: [
              {
                text: 'Write a two sentence story about a magic backpack',
              },
            ],
          },
        ],
      });
    });
  });
});

import { createFakeFetch } from '../utils';
import { OpenAIEmbedding } from '../../src/openai/embedding';

describe('openai embedding', () => {
  describe('run', () => {
    it('calculates embeddings', async () => {
      const fetchSpy = createFakeFetch({
        json: {
          object: 'list',
          data: [{ object: 'embedding', index: 0, embedding: [0, 1, 2, 3, 5, 6] }],
          model: 'text-embedding-ada-002-v2',
          usage: { prompt_tokens: 8, total_tokens: 8 },
        },
      });

      const response = await OpenAIEmbedding.run(
        {
          model: 'text-embedding-ada-002',
          input: 'Using no more than 20 words, what is the Eiffel tower?',
        },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      expect(response).toEqual({
        object: 'list',
        data: [{ object: 'embedding', index: 0, embedding: [0, 1, 2, 3, 5, 6] }],
        model: 'text-embedding-ada-002-v2',
        usage: { prompt_tokens: 8, total_tokens: 8 },
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.openai.com/v1/embeddings', {
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
        model: 'text-embedding-ada-002',
        input: 'Using no more than 20 words, what is the Eiffel tower?',
      });
    });

    it('can supply additional options', async () => {
      const abortController = new AbortController();

      const fetchSpy = createFakeFetch({
        json: {
          object: 'list',
          data: [{ object: 'embedding', index: 0, embedding: [0, 1, 2, 3, 5, 6] }],
          model: 'text-embedding-ada-002-v2',
          usage: { prompt_tokens: 8, total_tokens: 8 },
        },
      });

      await OpenAIEmbedding.run(
        {
          model: 'text-embedding-ada-002',
          input: 'Using no more than 20 words, what is the Eiffel tower?',
        },
        {
          apiKey: 'sk-not-real',
          fetch: fetchSpy as any,
          headers: { 'x-my-custom-header': 'custom-value' },
          signal: abortController.signal,
        },
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.openai.com/v1/embeddings', {
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
});

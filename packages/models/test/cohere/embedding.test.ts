import { createFakeFetch } from '../utils';
import { CohereEmbedding } from '../../src/cohere/embedding';

describe('cohere embedding', () => {
  describe('run', () => {
    it('calculates embeddings', async () => {
      const fetchSpy = createFakeFetch({
        json: {
          id: '2dac6b8b-2038-410d-9674-8b5e1b4eef47',
          texts: ['How can I deploy to fly.io?'],
          embeddings: [1, 2, 3, 4, 5, 6],
          meta: { api_version: { version: '1' } },
        },
      });

      const response = await CohereEmbedding.run(
        { texts: ['How can I deploy to fly.io?'] },
        { apiKey: 'sk-not-real', fetch: fetchSpy as any },
      );

      expect(response).toEqual({
        id: '2dac6b8b-2038-410d-9674-8b5e1b4eef47',
        texts: ['How can I deploy to fly.io?'],
        embeddings: [1, 2, 3, 4, 5, 6],
        meta: { api_version: { version: '1' } },
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('https://api.cohere.ai/v1/embed', {
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

      expect(bodyArgument).toEqual({ texts: ['How can I deploy to fly.io?'] });
    });
  });
});

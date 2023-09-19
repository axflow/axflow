import { createFakeFetch } from '../utils';
import { OllamaEmbedding } from '../../src/ollama/embedding';

describe('ollama embedding', () => {
  describe('run', () => {
    it('calculates embeddings', async () => {
      const fetchSpy = createFakeFetch({
        json: {
          embedding: [
            1.2192957401275635, -0.06883461773395538, 1.5663237571716309, 0.8945874571800232,
            -1.438734531402588, -0.9785516858100891,
          ],
        },
      });

      const response = await OllamaEmbedding.run(
        { model: 'llama2', prompt: 'How can I deploy to fly.io?' },
        { fetch: fetchSpy as any },
      );

      expect(response).toEqual({
        embedding: [
          1.2192957401275635, -0.06883461773395538, 1.5663237571716309, 0.8945874571800232,
          -1.438734531402588, -0.9785516858100891,
        ],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('http://127.0.0.1:11434/api/embeddings', {
        body: expect.any(String),
        method: 'POST',
        headers: {},
      });

      const args = fetchSpy.mock.lastCall as any;
      const bodyArgument = JSON.parse(args[1].body);

      expect(bodyArgument).toEqual({ model: 'llama2', prompt: 'How can I deploy to fly.io?' });
    });
  });
});

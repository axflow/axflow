import { BasicPrompt, PromptWithContext } from '../src/prompts';
import { QUESTION_WITH_CONTEXT, QUESTION_WITHOUT_CONTEXT } from '../src/templates';

describe('prompts', () => {
  describe('Prompt', () => {
    it('can render a template', async () => {
      const prompt = new BasicPrompt({ template: QUESTION_WITHOUT_CONTEXT });

      const result = await prompt.render({
        query: 'What year did the Golden Gate Bridge open to the public?',
      });

      expect(result).toEqual(
        'Question: What year did the Golden Gate Bridge open to the public?\nAnswer: '
      );
    });
  });

  describe('PromptWithContext', () => {
    it('can render a template', async () => {
      const prompt = new PromptWithContext({ template: QUESTION_WITH_CONTEXT });

      const result = await prompt.render({
        context: [
          'The Golden Gate Bridge is a suspension bridge spanning the Golden Gate, the one-mile-wide (1.6 km) strait connecting San Francisco Bay and the Pacific Ocean.',
          'The Golden Gate Bridge opened to the public in 1937.',
        ],
        query: 'What year did the Golden Gate Bridge open to the public?',
      });

      expect(result).toEqual(`Context information is below.
---------------------
The Golden Gate Bridge is a suspension bridge spanning the Golden Gate, the one-mile-wide (1.6 km) strait connecting San Francisco Bay and the Pacific Ocean.
The Golden Gate Bridge opened to the public in 1937.
---------------------
Given the context information and not prior knowledge, answer the question: What year did the Golden Gate Bridge open to the public?
`);
    });
  });
});

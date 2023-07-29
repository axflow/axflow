import { formatTemplate, zip } from '../src/utils';

describe('utils', () => {
  describe('zip', () => {
    it('can zip two lists', async () => {
      const l1 = [1, 3, 5];
      const l2 = ['2', '4', '6'];
      expect(zip(l1, l2)).toEqual([
        [1, '2'],
        [3, '4'],
        [5, '6'],
      ]);
    });

    it('fails if there is a length mismatch', () => {
      const l1 = [1, 3, 5];
      const l2 = ['2', '4'];

      expect(() => zip(l1, l2)).toThrowError('Cannot zip two lists of unequal length');
    });
  });

  describe('formatTemplate', () => {
    const template = `Use the context below to answer the question.

Context:
{context}

Question:
{question}

Answer: `;

    it('can format a template', () => {
      const actual = formatTemplate(template, {
        context: 'The Golden Gate Bridge opened to the public in 1937.',
        question: 'When did the Golden Gate Bridge open?',
      });

      const expected = `Use the context below to answer the question.

Context:
The Golden Gate Bridge opened to the public in 1937.

Question:
When did the Golden Gate Bridge open?

Answer: `;

      expect(actual).toEqual(expected);
    });

    it('throws an error if it cannot find a value for a variable', () => {
      expect(() =>
        formatTemplate(template, {
          context: 'The Golden Gate Bridge opened to the public in 1937.',
        })
      ).toThrowError('No value provided for template variable "question"');
    });
  });
});

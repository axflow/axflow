import { zip } from '../src/utils';

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
});

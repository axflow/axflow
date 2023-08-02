import { CSVSplitter } from '../../src/splitters/csv';

const CSV_FILE = `id,text
1,This is a sentence.
2,This is another sentence.
`;

const TSV_FILE = `id\ttext
1\tThis is a sentence.
2\tThis is another sentence.
`;

const UUID_REGEX =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;

describe('splitters', () => {
  describe('CSVSplitter', () => {
    it('can split a csv document', async () => {
      const splitter = new CSVSplitter();
      const result = await splitter.split({ url: 'file.csv', text: CSV_FILE, metadata: {} });

      expect(result).toHaveLength(2);

      expect(result).toContainEqual({
        id: expect.stringMatching(UUID_REGEX),
        url: 'file.csv',
        text: 'id: 1\ntext: This is a sentence.',
        metadata: {},
      });

      expect(result).toContainEqual({
        id: expect.stringMatching(UUID_REGEX),
        url: 'file.csv',
        text: 'id: 2\ntext: This is another sentence.',
        metadata: {},
      });
    });

    it('can split a csv document taking a single column', async () => {
      const splitter = new CSVSplitter({ column: 'text' });
      const result = await splitter.split({ url: 'file.csv', text: CSV_FILE, metadata: {} });

      expect(result).toHaveLength(2);

      expect(result).toContainEqual({
        id: expect.stringMatching(UUID_REGEX),
        url: 'file.csv',
        text: 'This is a sentence.',
        metadata: {},
      });

      expect(result).toContainEqual({
        id: expect.stringMatching(UUID_REGEX),
        url: 'file.csv',
        text: 'This is another sentence.',
        metadata: {},
      });
    });

    it('can split a csv document using a separator other than a comma', async () => {
      const splitter = new CSVSplitter({ separator: '\t' });
      const result = await splitter.split({ url: 'file.csv', text: TSV_FILE, metadata: {} });

      expect(result).toHaveLength(2);

      expect(result).toContainEqual({
        id: expect.stringMatching(UUID_REGEX),
        url: 'file.csv',
        text: 'id: 1\ntext: This is a sentence.',
        metadata: {},
      });

      expect(result).toContainEqual({
        id: expect.stringMatching(UUID_REGEX),
        url: 'file.csv',
        text: 'id: 2\ntext: This is another sentence.',
        metadata: {},
      });
    });
  });
});

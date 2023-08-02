import { IDataSplitter, Document, Chunk } from '../types';
import { generateId } from '../utils';
import { dsvFormat } from 'd3-dsv';

export const NAME = 'csv' as const;

export type CSVSplitterOptions = {
  column?: string;
  separator?: string;
};

export class CSVSplitter implements IDataSplitter {
  private column?: string;
  private separator: string;

  constructor(options?: CSVSplitterOptions) {
    this.column = options?.column;
    this.separator = options?.separator || ',';
  }

  async split(document: Document): Promise<Chunk[]> {
    const { column, separator } = this;

    const psv = dsvFormat(separator);
    const parsed = psv.parse(document.text.trim());

    if (column !== undefined) {
      if (!parsed.columns.includes(column)) {
        throw new Error(`Column ${column} not found in CSV file`);
      }

      return parsed.map((row) => ({
        id: generateId(),
        url: document.url,
        text: row[column] || '',
        metadata: document.metadata,
      }));
    }

    return parsed.map((row) => ({
      id: generateId(),
      url: document.url,
      text: Object.keys(row)
        .map((key) => `${key.trim()}: ${row[key]?.trim()}`)
        .join('\n'),
      metadata: document.metadata,
    }));
  }
}

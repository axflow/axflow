import { Document, IDataSource } from '../types';

export const NAME = 'text' as const;

export type TextDocumentOptions = {
  content: string;
  filename: string;
};

export class TextDocument implements IDataSource {
  private options: TextDocumentOptions;

  constructor(options: TextDocumentOptions) {
    this.options = options;
  }

  async *iterable(): AsyncIterable<Document> {
    const content = this.options.content;

    yield {
      url: `file://${this.options.filename}`,
      text: content,
    };
  }
}

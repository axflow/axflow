import { Document, IDataSource } from '../types';

export const NAME = 'text-document' as const;

export type TextDocumentOptions = {
  content: string;
  url: string;
};

export class TextDocument implements IDataSource {
  private options: TextDocumentOptions;

  constructor(options: TextDocumentOptions) {
    this.options = options;
  }

  async *iterable(): AsyncIterable<Document> {
    const content = this.options.content;

    yield {
      url: this.options.url,
      text: content,
      metadata: {},
    };
  }
}

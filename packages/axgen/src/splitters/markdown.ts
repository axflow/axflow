import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { IDataSplitter, Document, Chunk } from '../types';
import { generateId } from '../utils';

export const NAME = 'markdown' as const;

export type MarkdownSplitterOptions = {
  chunkSize?: number;
  chunkOverlap?: number;
  keepSeparator?: boolean;
};

export class MarkdownSplitter implements IDataSplitter {
  private splitter: MarkdownTextSplitter;

  constructor(options?: MarkdownSplitterOptions) {
    this.splitter = new MarkdownTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 0,
      ...options,
    });
  }

  async split(document: Document): Promise<Chunk[]> {
    const textChunks = await this.splitter.splitText(document.text);

    const chunks: Chunk[] = textChunks.map((chunk) => ({
      id: generateId(),
      url: document.url,
      text: chunk,
      metadata: document.metadata,
    }));

    return chunks;
  }
}

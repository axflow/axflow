import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { DataSplitterObject, Document, Chunk } from '../types';
import { generateId } from '../utils';

export const NAME = 'markdown' as const;

type Options = {
  chunkSize?: number;
  chunkOverlap?: number;
  keepSeparator?: boolean;
};

export class MarkdownSplitter implements DataSplitterObject {
  private splitter: MarkdownTextSplitter;

  constructor(options?: Options) {
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
      metadata: {},
    }));

    return chunks;
  }
}

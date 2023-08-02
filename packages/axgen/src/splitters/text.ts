import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { IDataSplitter, Chunk, Document } from '../types';
import { generateId } from '../utils';

export const NAME = 'text' as const;

export type TextSplitterOptions = {
  chunkSize?: number;
  chunkOverlap?: number;
  keepSeparator?: boolean;
  separators?: string[];
};

export class TextSplitter implements IDataSplitter {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(options?: TextSplitterOptions) {
    this.splitter = new RecursiveCharacterTextSplitter({
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

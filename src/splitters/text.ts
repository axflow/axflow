import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { DataSplitterObject, Chunk, Document } from '../types';
import { generateId } from '../utils';

export const NAME = 'text' as const;

type Options = {
  chunkSize?: number;
  chunkOverlap?: number;
  keepSeparator?: boolean;
  separators?: string[];
};

export class TextSplitter implements DataSplitterObject {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(options?: Options) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 0,
      ...options,
    });
  }

  async split(node: Document): Promise<Chunk[]> {
    const textChunks = await this.splitter.splitText(node.text);

    const chunks: Chunk[] = textChunks.map((chunk) => ({
      id: generateId(),
      url: node.url,
      text: chunk,
      metadata: {},
    }));

    return chunks;
  }
}

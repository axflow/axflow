import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { DataSplitterObject, SourceNode, Document } from '../types';
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

  async split(node: SourceNode): Promise<Document[]> {
    const chunks = await this.splitter.splitText(node.text);

    const documents: Document[] = chunks.map((chunk) => ({
      id: generateId(),
      url: node.url,
      text: chunk,
      metadata: {},
    }));

    return documents;
  }
}

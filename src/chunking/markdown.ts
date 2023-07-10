import { MarkdownTextSplitter } from 'langchain/text_splitter';

export async function chunk(markdown: string) {
  const splitter = new MarkdownTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 0,
  });

  const documents = await splitter.createDocuments([markdown]);

  return documents.map((document) => document.pageContent);
}

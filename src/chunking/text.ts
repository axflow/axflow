import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export async function chunk(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 0,
  });

  const documents = await splitter.createDocuments([text]);
  return documents.map((document) => document.pageContent);
}

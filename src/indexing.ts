import { createEmbedding } from './openai';
import { zip } from './utils';
import type { Document, VectorStore } from './types';

export async function index(store: VectorStore, iterator: AsyncGenerator<Document[]>) {
  for await (const documents of iterator) {
    const { data: embeddings } = await createEmbedding({
      input: documents.map((doc) => doc.text),
    });

    const vectorizedDocuments = zip(documents, embeddings).map(([document, embedding]) => ({
      ...document,
      embedding: embedding.embedding,
    }));

    await store.add(vectorizedDocuments);
  }
}

import { ChromaClient, type Collection } from 'chromadb';

import type { VectorStore, VectorizedDocument, VectorQuery, VectorQueryResult } from '../types';

export async function prepare(options: { collection: string; path?: string }) {
  const client = new ChromaClient({
    path: options.path,
  });

  await client.createCollection({
    name: options.collection,
  });
}

export async function teardown(options: { collection: string; path?: string }) {
  const client = new ChromaClient({
    path: options.path,
  });

  await client.deleteCollection({
    name: options.collection,
  });
}

export const NAME = 'chroma' as const;

export class Chroma implements VectorStore {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private initialized: Promise<void>;
  name = NAME;

  constructor(options: { collection: string | Collection; path?: string; client?: ChromaClient }) {
    this.client =
      options.client ||
      new ChromaClient({
        path: options.path,
      });

    const collection = options.collection;

    if (typeof collection === 'string') {
      this.initialized = this.client
        .getCollection({
          name: collection,
        })
        .then((collection) => {
          this.collection = collection;
        });
    } else if (collection) {
      this.collection = collection;
      this.initialized = Promise.resolve();
    } else {
      throw new Error('collection option is required');
    }
  }

  async add(documents: VectorizedDocument[]): Promise<string[]> {
    await this.initialized;

    const ids = [];
    const embeddings = [];
    const metadatas = [];
    const contents = [];

    for (const document of documents) {
      ids.push(document.id);
      embeddings.push(document.embedding);
      metadatas.push(document.metadata || {});
      contents.push(document.text);
    }

    const collection = this.getCollection();
    await collection.add({
      ids,
      embeddings,
      metadatas,
      documents: contents,
    });

    return ids;
  }

  async query(query: VectorQuery): Promise<VectorQueryResult[]> {
    await this.initialized;

    const collection = this.getCollection();
    const response = await collection.query({
      nResults: query.topK,
      queryEmbeddings: query.embedding,
      where: query.filterTerm ? { term: { $eq: query.filterTerm } } : undefined,
    });

    const ids = response.ids[0];
    const documents = response.documents[0];
    const metadatas = response.metadatas[0];
    const distances = response.distances ? response.distances[0] : [];

    const results: VectorQueryResult[] = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const document = documents[i] || '';
      const metadata = metadatas[i] || {};
      const distance = distances[i];
      const similarity = distance ? 1.0 - Math.exp(-distance) : null;

      results.push({
        id: id,
        document: {
          id: id,
          text: document,
          metadata: metadata,
        },
        similarity: similarity,
      });
    }

    return results;
  }

  private getCollection() {
    const collection = this.collection;

    if (!collection) {
      throw new Error('Collection not initialized');
    }

    return collection;
  }
}

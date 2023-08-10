import { ChromaClient, type Collection } from 'chromadb';

import type {
  IVectorStore,
  IVectorQueryOptions,
  IVectorQueryResult,
  ChunkWithEmbeddings,
} from '../types';

export const NAME = 'chroma' as const;

export class Chroma implements IVectorStore {
  static async prepare(options: { collection: string; path?: string }) {
    const client = new ChromaClient({
      path: options.path,
    });

    await client.createCollection({
      name: options.collection,
    });
  }

  static async teardown(options: { collection: string; path?: string }) {
    const client = new ChromaClient({
      path: options.path,
    });

    await client.deleteCollection({
      name: options.collection,
    });
  }

  private client: ChromaClient;
  private collection: Collection | null = null;
  private initialized: Promise<void>;

  constructor(options: { collection: string; path?: string }) {
    this.client = new ChromaClient({
      path: options.path,
    });

    this.initialized = this.client
      .getCollection({
        name: options.collection,
      })
      .then((collection) => {
        this.collection = collection;
      });
  }

  async add(chunks: ChunkWithEmbeddings[]): Promise<string[]> {
    await this.initialized;

    const ids = [];
    const embeddings = [];
    const metadatas = [];
    const contents = [];

    for (const chunk of chunks) {
      ids.push(chunk.id);
      embeddings.push(chunk.embeddings);
      metadatas.push({ ...chunk.metadata, _url: chunk.url });
      contents.push(chunk.text);
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

  async delete(ids: string | string[]) {
    await this.initialized;
    const collection = this.getCollection();
    await collection.delete({ ids: ids });
  }

  async query(embedding: number[], options: IVectorQueryOptions): Promise<IVectorQueryResult[]> {
    await this.initialized;

    const collection = this.getCollection();
    const response = await collection.query({
      nResults: options.topK,
      queryEmbeddings: embedding,
      where: options.filterTerm ? { term: { $eq: options.filterTerm } } : undefined,
    });

    const ids = response.ids[0];
    const chunks = response.documents[0];
    const metadatas = response.metadatas[0];
    const distances = response.distances ? response.distances[0] : [];

    const results: IVectorQueryResult[] = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const chunk = chunks[i] || '';
      const metadata = metadatas[i] || {};
      const distance = distances[i];
      const similarity = distance ? 1.0 - Math.exp(-distance) : null;

      const url = metadata._url as string;
      delete metadata._url;

      results.push({
        id: id,
        chunk: {
          id: id,
          url: url,
          text: chunk,
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
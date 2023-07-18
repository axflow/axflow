import { ChromaClient, type Collection } from 'chromadb';

import type { VectorStore, ChunkWithEmbeddings, VectorQuery, VectorQueryResult } from '../types';

export const NAME = 'chroma' as const;

export class Chroma implements VectorStore {
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

  async add(
    iterable: ChunkWithEmbeddings[] | AsyncIterable<ChunkWithEmbeddings[]>
  ): Promise<string[]> {
    await this.initialized;

    if (Array.isArray(iterable)) {
      return this._add(iterable);
    }

    let ids: string[] = [];

    for await (const chunks of iterable) {
      ids = ids.concat(await this._add(chunks));
    }

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
    const chunks = response.documents[0];
    const metadatas = response.metadatas[0];
    const distances = response.distances ? response.distances[0] : [];

    const results: VectorQueryResult[] = [];

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

  private async _add(chunks: ChunkWithEmbeddings[]) {
    const ids = [];
    const embeddings = [];
    const metadatas = [];
    const contents = [];

    for (const document of chunks) {
      ids.push(document.id);
      embeddings.push(document.embeddings);
      metadatas.push({ ...document.metadata, _url: document.url });
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

  private getCollection() {
    const collection = this.collection;

    if (!collection) {
      throw new Error('Collection not initialized');
    }

    return collection;
  }
}

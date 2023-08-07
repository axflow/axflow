import { QdrantClient } from '@qdrant/qdrant-js';

import type {
  IVectorStore,
  IVectorQueryResult,
  IVectorQueryOptions,
  ChunkWithEmbeddings,
} from '../types';
import { wrap } from '../utils';

export const NAME = 'qdrant' as const;

export type Distance = 'Cosine' | 'Euclid' | 'Dot';

export class Qdrant implements IVectorStore {
  // TODO support all options with defaults
  static async prepare(options: {
    collection: string;
    url: string;
    distance: Distance;
    apiKey?: string;
    dimension: number;
  }) {
    const client = new QdrantClient({ url: options.url, apiKey: options.apiKey });

    // Let's check to see if the collection already exists,
    // and overwrite it if it does.
    const response = await client.getCollections();
    const collections = response.collections.map((collection) => collection.name);

    if (collections.includes(options.collection)) {
      await client.deleteCollection(options.collection);
    }

    await client.createCollection(options.collection, {
      vectors: {
        size: options.dimension,
        distance: options.distance,
      },
      // TODO many more options to support
    });
  }

  static async teardown(options: { url: string; apiKey?: string | undefined; collection: string }) {
    const client = new QdrantClient({
      url: options.url,
      apiKey: options.apiKey,
    });

    await client.deleteCollection(options.collection);
  }

  private client: QdrantClient;
  private collection: string;
  private url: string;

  constructor(options: { url: string; collection: string }) {
    this.url = options.url;
    this.collection = options.collection;
    this.client = new QdrantClient({ url: this.url });
  }

  async add(chunks: ChunkWithEmbeddings[], options?: { chunkSize?: number }): Promise<string[]> {
    const points = [];
    const ids = [];

    for (const chunk of chunks) {
      points.push({
        id: chunk.id,
        vector: chunk.embeddings,
        payload: {
          ...chunk.metadata,
          _text: chunk.text,
          _url: chunk.url,
        },
      });
      ids.push(chunk.id);
    }

    const { operation_id, status } = await this.client.upsert(this.collection, {
      wait: true,
      points: points,
    });
    if (status !== 'completed') {
      throw new Error(`Upsert failed with status ${status}. Operation_id: ${operation_id}`);
    }
    return ids;
  }

  async delete(ids: string | string[]) {
    await this.client.delete(this.collection, { wait: true, points: wrap(ids) });
  }

  async query(embedding: number[], options: IVectorQueryOptions): Promise<IVectorQueryResult[]> {
    // TODO add support for filterTerm
    const response = await this.client.search(this.collection, {
      vector: embedding,
      limit: options.topK,
    });

    return response.map((match) => {
      const metadata = match.payload as Record<string, any>;

      const url = metadata._url;
      const text = metadata._text;

      delete metadata._url;
      delete metadata._text;

      return {
        id: String(match.id),
        chunk: {
          id: String(match.id),
          url: url,
          text: text,
          metadata: metadata,
        },
        similarity: match.score || null,
      };
    });
  }
}

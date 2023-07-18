import { PineconeClient, utils as pineconeUtils } from '@pinecone-database/pinecone';

const { chunkedUpsert } = pineconeUtils;

import type {
  IVectorStore,
  IVectorQueryResult,
  IVectorQueryOptions,
  ChunkWithEmbeddings,
} from '../types';
import { wrap } from '../utils';

export const NAME = 'pinecone' as const;

export class Pinecone implements IVectorStore {
  static async prepare(options: {
    apiKey: string;
    environment: string;
    index: string;
    dimension: number;
  }) {
    const { createIndexIfNotExists } = pineconeUtils;

    const pinecone = new PineconeClient();

    await pinecone.init({
      apiKey: options.apiKey,
      environment: options.environment,
    });

    const index = options.index;
    const dimension = options.dimension;

    await createIndexIfNotExists(pinecone, index, dimension);
  }

  static async teardown(options: { apiKey: string; environment: string; index: string }) {
    const pinecone = new PineconeClient();

    await pinecone.init({
      apiKey: options.apiKey,
      environment: options.environment,
    });

    await pinecone.deleteIndex({
      indexName: options.index,
    });
  }

  private index: string;
  private namespace: string;
  private client: PineconeClient;
  private initialized: Promise<void>;

  constructor(options: { index: string; namespace: string; apiKey: string; environment: string }) {
    this.index = options.index;
    this.namespace = options.namespace;

    const { apiKey, environment } = options;

    if (!apiKey || !environment) {
      throw new Error(
        'apiKey and environment options are required when the client option is not provided'
      );
    }

    this.client = new PineconeClient();
    this.initialized = this.client.init({ apiKey, environment });
  }

  async add(chunks: ChunkWithEmbeddings[], options?: { chunkSize?: number }): Promise<string[]> {
    await this.initialized;

    const ids = [];
    const vectors = [];

    for (const chunk of chunks) {
      ids.push(chunk.id);

      vectors.push({
        id: chunk.id,
        values: chunk.embeddings,
        metadata: {
          ...chunk.metadata,
          _text: chunk.text,
          _url: chunk.url,
        },
      });
    }

    const index = this.getIndex();
    await chunkedUpsert(index, vectors, this.namespace, options?.chunkSize);

    return ids;
  }

  async delete(ids: string | string[]) {
    await this.initialized;
    const index = this.getIndex();
    await index.delete1({
      ids: wrap(ids),
      namespace: this.namespace,
    });
  }

  async query(embedding: number[], options: IVectorQueryOptions): Promise<IVectorQueryResult[]> {
    await this.initialized;

    const index = this.getIndex();
    const response = await index.query({
      queryRequest: {
        topK: options.topK,
        vector: embedding,
        namespace: this.namespace,
        includeMetadata: true,
        filter: options.filterTerm ? { term: { $eq: options.filterTerm } } : undefined,
      },
    });

    const matches = response.matches || [];

    return matches.map((match) => {
      const metadata = match.metadata as Record<string, any>;

      const url = metadata._url;
      const text = metadata._text;

      delete metadata._url;
      delete metadata._text;

      return {
        id: match.id,
        chunk: {
          id: match.id,
          url: url,
          text: text,
          metadata: metadata,
        },
        similarity: match.score || null,
      };
    });
  }

  private getIndex() {
    return this.client.Index(this.index);
  }
}

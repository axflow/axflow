import { EpsillaDB } from 'epsillajs';

import {
  ChunkWithEmbeddings,
  IVectorQueryOptions,
  IVectorQueryResult,
  IVectorStore
} from '../types';

export const NAME = 'epsilla' as const;

interface EpsillaConfig {
  dbPath: string;
  collection: string;
  protocol?: string;
  host?: string;
  port?: number;
  dbName?: string;
}

interface EpsillaSetupConfig extends EpsillaConfig {
  dimension: number;
}

interface RecordItem {
  id: string;
  text: string;
  embedding: number[];
  url: string;
  metadata: any;
  '@distance'?: number;
}

function generateFields(dimension: number) {
  return [
    {
      name: 'id',
      dataType: 'STRING',
      primaryKey: true
    },
    {
      name: 'text',
      dataType: 'STRING'
    },
    {
      name: 'embedding',
      dataType: 'VECTOR_FLOAT',
      dimensions: dimension
    },
    {
      name: 'url',
      dataType: 'STRING'
    },
    {
      name: 'metadata',
      dataType: 'JSON'
    }
  ];
}

export class Epsilla implements IVectorStore {
  static async prepare(options: EpsillaSetupConfig) {
    const config = {
      protocol: options?.protocol || 'http',
      host: options?.host || 'localhost',
      port: options?.port || 8888
    };
    const client = new EpsillaDB(config);
    const dbName = options?.dbName || 'axgen_store';
    await client.loadDB(options.dbPath, dbName);
    client.useDB(dbName);

    // Let's check to see if the collection already exists,
    // and overwrite it if it does.
    const response = await client.listTables();
    const tables = response.result;

    if (tables.includes(dbName)) {
      await client.dropTable(dbName);
    }

    await client.createTable(options.collection, generateFields(options.dimension))
  }

  static async teardown(options: EpsillaConfig) {
    const config = {
      protocol: options?.protocol || 'http',
      host: options?.host || 'localhost',
      port: options?.port || 8888
    };
    const client = new EpsillaDB(config);
    const dbName = options?.dbName || 'axgen_store';
    await client.loadDB(options.dbPath, dbName);
    await client.dropTable(options.collection);
  }

  private client: EpsillaDB;
  private collection: string;

  constructor(options: EpsillaConfig) {
    const config = {
      protocol: options?.protocol || 'http',
      host: options?.host || 'localhost',
      port: options?.port || 8888
    };
    this.client = new EpsillaDB(config);
    const dbName = options?.dbName || 'axgenDB';
    this.client.loadDB(options.dbPath, dbName);
    this.client.useDB(dbName);
    this.collection = options.collection;
  }

  async add(chunks: ChunkWithEmbeddings[], options?: {  }): Promise<string[]> {
    const data: RecordItem[] = [];
    const ids = [];

    for (const chunk of chunks) {
      data.push({
        id: chunk.id,
        text: chunk.text,
        embedding: chunk.embeddings,
        url: chunk.url,
        metadata: chunk.metadata
      });
      ids.push(chunk.id);
    }

    const response = await this.client.insert(this.collection, data);
    if (response.statusCode !== 200) {
      throw new Error(response.message);
    }
    return ids;
  }

  async delete(ids: string | string[]): Promise<void> {
    let primaryKeys;
    if (typeof ids === 'string') {
      primaryKeys = [ids];
    } else {
      primaryKeys = ids;
    }

    await this.client.deleteByPrimaryKeys(this.collection, primaryKeys);
  }

  async query(embedding: number[], options: IVectorQueryOptions): Promise<IVectorQueryResult[]> {
    const response =
      await this.client.query(this.collection, 'embedding', embedding, options.topK, [], true);

    return response['result'].map((res: RecordItem) => {
      const metadata = res.metadata as Record<string, any>;

      return {
        id: String(res.id),
        chunk: {
          id: String(res.id),
          url: res.url,
          text: res.text,
          metadata: metadata,
        },
        similarity: res['@distance'] || null,
      };
    });
  }
}
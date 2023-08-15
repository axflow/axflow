import pgpromise from 'pg-promise';
import { IInitOptions, ParameterizedQuery } from 'pg-promise';
import { registerType, toSql } from 'pgvector/pg';
import type {
  IVectorStore,
  IVectorQueryOptions,
  IVectorQueryResult,
  ChunkWithEmbeddings,
} from '../types';
import { wrap } from '../utils';

function schema(tableName: string) {
  return `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      id TEXT PRIMARY KEY,
      embedding VECTOR($1) NOT NULL,
      text TEXT NOT NULL,
      url TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `;
}

function getDB(dsn: string) {
  const initOptions: IInitOptions = {
    async connect(e) {
      await registerType(e.client);
    },
  };

  const pgp = pgpromise(initOptions);
  return pgp(dsn);
}

export const NAME = 'pgvector' as const;

export class PgVector implements IVectorStore {
  static async prepare(options: { tableName: string; dimension: number; dsn: string }) {
    if (options.dimension > 2000) {
      throw new Error('pgvector currently only supports dimensions less than 2000');
    }

    const db = getDB(options.dsn);

    await db.none('CREATE EXTENSION IF NOT EXISTS vector;');
    await db.none(schema(options.tableName), [options.dimension]);
  }

  static async teardown(options: { tableName: string; dsn: string }) {
    const name = options.tableName;
    const db = getDB(options.dsn);
    await db.none(`DROP TABLE IF EXISTS ${name};`);
  }

  private db: pgpromise.IDatabase<{}>;
  private tableName: string;

  constructor(options: { dsn: string; tableName: string }) {
    this.db = getDB(options.dsn);
    this.tableName = options.tableName;
  }

  async add(chunks: ChunkWithEmbeddings[]): Promise<string[]> {
    const ids = [];

    for (const chunk of chunks) {
      ids.push(chunk.id);

      // TODO make this a put_multi
      await this.db.none(
        `INSERT INTO ${this.tableName} (id, embedding, text, url, metadata) VALUES ($1, $2, $3, $4, $5)`,
        [chunk.id, toSql(chunk.embeddings), chunk.text, chunk.url, chunk.metadata]
      );
    }

    return ids;
  }

  async delete(ids: string | string[]) {
    await this.db.result(`DELETE FROM ${this.tableName} WHERE id IN ($1:list)`, [wrap(ids)]);
  }

  async query(embedding: number[], options: IVectorQueryOptions): Promise<IVectorQueryResult[]> {
    // Operators (https://github.com/pgvector/pgvector/#distances):
    // '<->': L2 distance
    // '<#>': negative inner product
    // '<=>': cosine similarity
    const findVectors = options.filterTerm
      ? new ParameterizedQuery({
          text: `SELECT * FROM ${this.tableName} WHERE metadata->>'term' = $1 ORDER BY embedding <=> $2 LIMIT $3`,
          values: [options.filterTerm, toSql(embedding), options.topK],
        })
      : new ParameterizedQuery({
          text: `SELECT * FROM ${this.tableName} ORDER BY embedding <=> $1 LIMIT $2`,
          values: [toSql(embedding), options.topK],
        });

    const response = await this.db.any(findVectors);
    return response.map((row) => {
      return {
        id: row.id,
        chunk: {
          id: row.id,
          url: row.url,
          text: row.text,
          metadata: row.metadata,
        },
        // PG doesn't give us similarity
        similarity: null,
      };
    });
  }
}

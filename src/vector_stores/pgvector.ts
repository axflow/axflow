import pgpromise from 'pg-promise';
import { IInitOptions, ParameterizedQuery } from 'pg-promise';
import { registerType, toSql } from 'pgvector/pg';
import type { VectorStore, ChunkWithEmbeddings, VectorQuery, VectorQueryResult } from '../types';

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

export class PgVector implements VectorStore {
  static async prepare(options: { tableName: string; dimension: number; dsn: string }) {
    if (options.dimension > 2000) {
      throw new Error('pgvector currently only supports dimensions less than 2000');
    }

    const db = getDB(options.dsn);

    await db.none('CREATE EXTENSION IF NOT EXISTS vector;');
    await db.none(
      `CREATE TABLE IF NOT EXISTS ${options.tableName} (id bigserial PRIMARY KEY, embedding vector($1), text TEXT, url TEXT, metadata JSONB)`,
      [options.dimension]
    );
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

  async add(
    iterable: ChunkWithEmbeddings[] | AsyncIterable<ChunkWithEmbeddings[]>
  ): Promise<string[]> {
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
    // Operators (https://github.com/pgvector/pgvector/#distances):
    // '<->': L2 distance
    // '<#>': negative inner product
    // '<=>': cosine similarity
    const findVectors = query.filterTerm
      ? new ParameterizedQuery({
          text: `SELECT * FROM ${this.tableName} WHERE metadata->>'term' = $1 ORDER BY embedding <=> $2 LIMIT $3`,
          values: [query.filterTerm, toSql(query.embedding), query.topK],
        })
      : new ParameterizedQuery({
          text: `SELECT * FROM ${this.tableName} ORDER BY embedding <=> $1 LIMIT $2`,
          values: [toSql(query.embedding), query.topK],
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

  private async _add(chunks: ChunkWithEmbeddings[]) {
    const ids = [];

    for (const chunk of chunks) {
      ids.push(chunk.id);

      // TODO make this a put_multi
      await this.db.none(
        `INSERT INTO ${this.tableName} (embedding, text, url, metadata) VALUES ($1, $2, $3, $4)`,
        [toSql(chunk.embeddings), chunk.text, chunk.url, chunk.metadata]
      );
    }

    return ids;
  }
}

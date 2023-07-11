import pgpromise from 'pg-promise';
import { IInitOptions } from 'pg-promise';
import { registerType, toSql } from 'pgvector/pg';
import type { VectorStore, VectorizedDocument, VectorQuery, VectorQueryResult } from '../types';

function getDB(dsn: string) {
  const initOptions: IInitOptions = {
    async connect(e) {
      await registerType(e.client);
    },
  };

  const pgp = pgpromise(initOptions);
  return pgp(dsn);
}

export async function prepare(options: { tableName: string; dimension: number; dsn: string }) {
  if (options.dimension > 2000) {
    throw new Error('pgvector currently only supports dimensions less than 2000');
  }

  const db = getDB(options.dsn);

  await db.none('CREATE EXTENSION IF NOT EXISTS vector;');
  await db.none(
    `CREATE TABLE IF NOT EXISTS ${options.tableName} (id bigserial PRIMARY KEY, embedding vector($1), text TEXT, metadata JSONB)`,
    [options.dimension]
  );
}

export async function teardown(options: { tableName: string; dsn: string }) {
  const name = options.tableName;
  const db = getDB(options.dsn);
  await db.none(`DROP TABLE IF EXISTS ${name};`);
}

export class PgVector implements VectorStore {
  private db: pgpromise.IDatabase<{}>;
  private tableName: string;
  name: string = 'pgvector';

  constructor(options: { dsn: string; tableName: string }) {
    this.db = getDB(options.dsn);
    this.tableName = options.tableName;
  }

  async add(documents: VectorizedDocument[]): Promise<string[]> {
    const ids = [];

    for (const document of documents) {
      ids.push(document.id);

      // TODO make this a put_multi
      await this.db.none(
        `INSERT INTO ${this.tableName} (embedding, text, metadata) VALUES ($1, $2, $3)`,
        [toSql(document.embedding), document.text, document.metadata]
      );
    }

    return ids;
  }

  async query(query: VectorQuery): Promise<VectorQueryResult[]> {
    // Operators:
    // '<->': L2 distance
    // '<#>' negative inner product
    // '<=>' cosine similarity
    // Full docs: https://github.com/pgvector/pgvector/#distances
    const response = await this.db.any(
      `SELECT * FROM ${this.tableName} ORDER BY embedding <=> $1 LIMIT ${query.topK}`,
      [toSql(query.embedding)]
    );
    return response.map((row) => {
      return {
        id: row.id,
        document: {
          id: row.id,
          text: row.text,
          metadata: row.metadata,
        },
        // PG doesn't give us similarity
        similarity: null,
      };
    });
  }
}

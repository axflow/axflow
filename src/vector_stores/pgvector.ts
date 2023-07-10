import pgpromise from 'pg-promise';
import { IInitOptions } from 'pg-promise';
import { registerType, toSql } from 'pgvector/pg';
import { getEnvOrThrow } from '../config';
import type { VectorStore, VectorizedDocument, VectorQuery, VectorQueryResult } from '../types';

const initOptions: IInitOptions = {
  async connect(e) {
    await registerType(e.client);
  },
};

const pgp = pgpromise(initOptions);
const db = pgp(getEnvOrThrow('PG_DSN'));

export async function prepare(options: { tableName: string; dimension: number }) {
  if (options.dimension > 2000) {
    throw new Error('pgvector currently only supports dimensions less than 2000');
  }

  await db.none('CREATE EXTENSION IF NOT EXISTS vector;');

  await db.none(
    `CREATE TABLE IF NOT EXISTS ${options.tableName} (id bigserial PRIMARY KEY, embedding vector($1), text TEXT, metadata JSONB)`,
    [options.dimension]
  );
  console.log(`Created table ${options.tableName}`);
}

export async function teardown(options: { tableName: string }) {
  const name = options.tableName;
  await db.none(`DROP TABLE IF EXISTS ${name};`);
  console.log('Dropped table if exists:', name);
}

export class PgVector implements VectorStore {
  private dsn: string;
  private tableName: string;
  private initialized: Promise<void>;
  name: string = 'pgvector';

  constructor(options: { dsn: string; tableName: string }) {
    this.dsn = options.dsn;
    this.tableName = options.tableName;
    // Consider running a query against the table. If it fails, throw with prepare instructions
    this.initialized = Promise.resolve();
  }

  async add(documents: VectorizedDocument[]): Promise<string[]> {
    await this.initialized;

    const ids = [];

    for (const document of documents) {
      ids.push(document.id);

      // TODO make this a put_multi
      await db.none(
        `INSERT INTO ${this.tableName} (embedding, text, metadata) VALUES ($1, $2, $3)`,
        [toSql(document.embedding), document.text, document.metadata]
      );
    }

    return ids;
  }

  async query(query: VectorQuery): Promise<VectorQueryResult[]> {
    await this.initialized;

    // Note that '<->' is a specific distance algorithm: L2 distance.
    // See also: '<#>' for negative inner product, and '<=>' for cosine similarity.
    // Docs: https://github.com/pgvector/pgvector/#distances
    const response = await db.any(
      `SELECT * FROM ${this.tableName} ORDER BY embedding <-> $1 LIMIT ${query.topK}`,
      [toSql(query.embedding)]
    );
    console.log('Response:', response);
    return [];
  }

  getDsn() {
    return this.dsn;
  }

  getTableName() {
    return this.tableName;
  }
}
//
//
//     const matches = response.matches || [];
//
//     return matches.map((match) => {
//       const metadata = match.metadata as Record<string, any>;
//       const text = metadata._text;
//
//       delete metadata._text;
//
//       return {
//         id: match.id,
//         document: {
//           id: match.id,
//           text: text,
//           metadata: metadata,
//         },
//         similarity: match.score || null,
//       };
//     });
//   }
//
//   private getIndex() {
//     return this.client.Index(this.index);
//   }
// }

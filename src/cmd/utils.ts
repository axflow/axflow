import { read as fsRead } from '../readers/fs';
import { read as wikipediaRead } from '../readers/wikipedia';
import { Pinecone } from '../vector_stores/pinecone';
import { Chroma } from '../vector_stores/chroma';
import { PgVector } from '../vector_stores/pgvector';
import { getEnv, getEnvOrThrow } from '../config';
import { VectorStore } from '../types';

import type { SupportedReaders } from '../readers';
import type { SupportedVectorStores } from '../vector_stores';

export function getVectorStore(store: SupportedVectorStores): VectorStore {
  switch (store) {
    case 'chroma':
      return new Chroma({
        path: getEnv('CHROMA_PATH'),
        collection: getEnvOrThrow('CHROMA_COLLECTION'),
      });
    case 'pinecone':
      return new Pinecone({
        index: getEnvOrThrow('PINECONE_INDEX'),
        namespace: getEnvOrThrow('PINECONE_NAMESPACE'),
        apiKey: getEnvOrThrow('PINECONE_API_KEY'),
        environment: getEnvOrThrow('PINECONE_ENVIRONMENT'),
      });
    case 'pgvector':
      return new PgVector({
        dsn: getEnvOrThrow('PG_DSN'),
        tableName: getEnvOrThrow('PG_TABLE_NAME'),
      });
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

export function getReader(type: SupportedReaders) {
  switch (type) {
    case 'fs':
      return fsRead;
    case 'wikipedia':
      return wikipediaRead;
    default:
      throw new Error(`Unsupported reader "${type}"`);
  }
}

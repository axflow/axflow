import { FileSystem, Wikipedia } from '../sources';
import { Pinecone, PgVector, Qdrant, Epsilla } from '../vector_stores';
import { OpenAIEmbedder, VertexAIEmbedder, CohereEmbedder } from '../embedders';
import { CSVSplitter, MarkdownSplitter, TextSplitter } from '../splitters';
import { getEnv, getEnvOrThrow } from '../config';

import type { IVectorStore } from '../types';
import type { SupportedDataSources } from '../sources';
import type { SupportedVectorStores } from '../vector_stores';
import type { SupportedDataSplitters } from '../splitters';
import type { SupportedDataEmbedders } from '../embedders';

export function getVectorStore(store: SupportedVectorStores): IVectorStore {
  switch (store) {
    case 'pinecone':
      return new Pinecone({
        index: getEnvOrThrow('PINECONE_INDEX'),
        namespace: getEnvOrThrow('PINECONE_NAMESPACE'),
        apiKey: getEnvOrThrow('PINECONE_API_KEY'),
        environment: getEnvOrThrow('PINECONE_ENVIRONMENT'),
      });
    case 'qdrant':
      return new Qdrant({
        collection: getEnvOrThrow('QDRANT_COLLECTION'),
        url: getEnvOrThrow('QDRANT_URL'),
      });
    case 'pgvector':
      return new PgVector({
        dsn: getEnvOrThrow('PG_DSN'),
        tableName: getEnvOrThrow('PG_TABLE_NAME'),
      });
    case 'epsilla':
      return new Epsilla({
        dbPath: getEnvOrThrow('EPSILLA_DB_PATH'),
        collection: getEnvOrThrow('EPSILLA_COLLECTION'),
        protocol: getEnv('EPSILLA_PROTOCOL'),
        host: getEnv('EPSILLA_HOST'),
        port: Number(getEnv('EPSILLA_PORT')),
        dbName: getEnv('EPSILLA_DB_NAME'),
      });
    default:
      throw new Error(`Unrecognized vector store "${store}"`);
  }
}

export function getDataSource(type: SupportedDataSources, options: any) {
  switch (type) {
    case 'file_system':
      return new FileSystem(options);
    case 'wikipedia':
      return new Wikipedia(options);
    default:
      throw new Error(`Unsupported data source "${type}"`);
  }
}

export function getDataSplitter(type: SupportedDataSplitters, options: any) {
  switch (type) {
    case 'markdown':
      return new MarkdownSplitter(options);
    case 'text':
      return new TextSplitter(options);
    case 'csv':
      return new CSVSplitter(options);
    default:
      throw new Error(`Unsupported data splitter "${type}"`);
  }
}

export function getDataEmbedder(type: SupportedDataEmbedders, options: any) {
  switch (type) {
    case 'openai':
      return new OpenAIEmbedder({
        apiKey: getEnv('OPENAI_API_KEY'),
        ...options,
      });
    case 'vertexai':
      return new VertexAIEmbedder(options);
    case 'cohere':
      return new CohereEmbedder(options);
    default:
      throw new Error(`Unsupported data embedder "${type}"`);
  }
}

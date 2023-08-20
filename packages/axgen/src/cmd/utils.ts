import { FileSystem } from '../sources/file-system';
import { Wikipedia } from '../sources/wikipedia';
import { MarkdownSplitter } from '../splitters/markdown';
import { TextSplitter } from '../splitters/text';
import { Pinecone } from '../vector_stores/pinecone';
import { Qdrant } from '../vector_stores/qdrant';
import { PgVector } from '../vector_stores/pgvector';
import { getEnv, getEnvOrThrow } from '../config';
import { IVectorStore } from '../types';
import { OpenAIEmbedder, VertexAIEmbedder, CohereEmbedder } from '../embedders';

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
      return new VertexAIEmbedder();
    case 'cohere':
      return new CohereEmbedder(options);
    default:
      throw new Error(`Unsupported data embedder "${type}"`);
  }
}

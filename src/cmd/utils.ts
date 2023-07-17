import { FileSystem } from '../sources/file-system';
import { Wikipedia } from '../sources/wikipedia';
import { MarkdownSplitter } from '../splitters/markdown';
import { TextSplitter } from '../splitters/text';
import { OpenAIEmbedder } from '../embedders/open-ai-embedder';
import { Pinecone } from '../vector_stores/pinecone';
import { Chroma } from '../vector_stores/chroma';
import { PgVector } from '../vector_stores/pgvector';
import { getEnv, getEnvOrThrow } from '../config';
import { VectorStore } from '../types';

import type { SupportedDataSources } from '../sources';
import type { SupportedVectorStores } from '../vector_stores';
import type { SupportedDataSplitters } from '../splitters';
import type { SupportedDataEmbedders } from '../embedders';

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
    default:
      throw new Error(`Unsupported data embedder "${type}"`);
  }
}

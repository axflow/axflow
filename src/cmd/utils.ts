import { Pinecone } from '../vector_stores/pinecone';
import { Chroma } from '../vector_stores/chroma';
import { getEnv, getEnvOrThrow } from '../config';
import { VectorStore } from '../types';

export function getVectorStore(store: string): VectorStore {
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
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

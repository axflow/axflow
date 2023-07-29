import { NAME as chroma } from './chroma';
import { NAME as pinecone } from './pinecone';

export const SUPPORTED_VECTOR_STORES = [chroma, pinecone] as const;
export type SupportedVectorStores = (typeof SUPPORTED_VECTOR_STORES)[number];

export { Chroma } from './chroma';
export { Pinecone } from './pinecone';

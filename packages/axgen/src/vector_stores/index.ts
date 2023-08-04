import { NAME as pinecone } from './pinecone';

export const SUPPORTED_VECTOR_STORES = [pinecone] as const;
export type SupportedVectorStores = (typeof SUPPORTED_VECTOR_STORES)[number];

export { Pinecone } from './pinecone';

import { NAME as openai } from './open-ai-embedder';
import { NAME as vertexai } from './vertex-ai-embedder';
import { NAME as cohere } from './cohere-embedder';

export const SUPPORTED_DATA_EMBEDDERS = [openai, vertexai, cohere] as const;
export type SupportedDataEmbedders = (typeof SUPPORTED_DATA_EMBEDDERS)[number];

export { OpenAIEmbedder, type OpenAIEmbedderOptions } from './open-ai-embedder';
export { VertexAIEmbedder, type VertexAIEmbedderOptions } from './vertex-ai-embedder';
export { CohereEmbedder, type CohereEmbedderOptions } from './cohere-embedder';

import { NAME as openai } from './open-ai-embedder';
import { NAME as vertexai } from './vertex-ai-embedder';

export const SUPPORTED_DATA_EMBEDDERS = [openai, vertexai] as const;
export type SupportedDataEmbedders = (typeof SUPPORTED_DATA_EMBEDDERS)[number];

export { OpenAIEmbedder, type OpenAIEmbedderOptions } from './open-ai-embedder';
export { VertexAIEmbedder, type VertexAIEmbedderOptions } from './vertex-ai-embedder';

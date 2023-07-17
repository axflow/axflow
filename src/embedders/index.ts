import { NAME as openai } from './open-ai-embedder';

export const SUPPORTED_DATA_EMBEDDERS = [openai] as const;
export type SupportedDataEmbedders = (typeof SUPPORTED_DATA_EMBEDDERS)[number];

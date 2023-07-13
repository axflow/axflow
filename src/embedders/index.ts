import { NAME as openai } from './openai';

export const SUPPORTED_DATA_EMBEDDERS = [openai] as const;
export type SupportedDataEmbedders = (typeof SUPPORTED_DATA_EMBEDDERS)[number];

import { NAME as fs } from './fs';
import { NAME as wikipedia } from './wikipedia';

export const SUPPORTED_READERS = [fs, wikipedia] as const;
export type SupportedReaders = (typeof SUPPORTED_READERS)[number];

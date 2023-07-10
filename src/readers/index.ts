import { read as fsRead } from './fs';
import { read as wikipediaRead } from './wikipedia';

export const SUPPORTED_READERS = ['fs', 'wikipedia'] as const;
export type SupportedReaders = (typeof SUPPORTED_READERS)[number];

export function getReader(type: SupportedReaders) {
  switch (type) {
    case 'fs':
      return fsRead;
    case 'wikipedia':
      return wikipediaRead;
    default:
      throw new Error(`Unsupported reader "${type}"`);
  }
}

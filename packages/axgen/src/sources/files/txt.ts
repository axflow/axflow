import { readFile } from 'fs/promises';
import type { Document } from '../../types';

export { toDocument };

type OptionsType = {
  url?: string;
};

async function toDocument(file: Buffer, options?: OptionsType): Promise<Document>;
async function toDocument(path: string, options?: OptionsType): Promise<Document>;
async function toDocument(file: Buffer | string, options?: OptionsType): Promise<Document> {
  let buffer: Buffer;
  let url: string;

  if (typeof file === 'string') {
    buffer = await readFile(file);
    url = options?.url || file;
  } else {
    buffer = file;
    url = options?.url || 'file.txt';
  }

  return {
    url: url,
    text: buffer.toString('utf8'),
    metadata: {},
  };
}

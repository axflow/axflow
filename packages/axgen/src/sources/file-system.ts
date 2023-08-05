import { stat as fsStat } from 'node:fs/promises';
import { converters, type ConverterKeys } from './files';
import { resolve, join, extname } from 'node:path';

import { glob } from 'glob';

import { Document, IDataSource } from '../types';

export const NAME = 'file_system' as const;

export type FileSystemOptions = {
  path: string;
  glob?: string;
};

export class FileSystem implements IDataSource {
  private options: FileSystemOptions;

  constructor(options: FileSystemOptions) {
    this.options = options;
  }

  async *iterable(): AsyncIterable<Document> {
    const path = resolve(process.cwd(), this.options.path);

    const stat = await fsStat(path);

    if (stat.isFile()) {
      yield this.documentFromFilePath(path);
    } else if (stat.isDirectory()) {
      const globPath = join(path, this.options.glob || '');
      const filePaths = await glob(globPath);
      for await (const filePath of filePaths) {
        yield this.documentFromFilePath(filePath);
      }
    } else {
      throw new Error(`Invalid file or directory path "${path}"`);
    }
  }

  private async documentFromFilePath(filePath: string) {
    const ext = extname(filePath).toLowerCase().slice(1) as ConverterKeys;
    const toDocument = converters[ext] || converters['txt'];
    return toDocument(filePath);
  }
}

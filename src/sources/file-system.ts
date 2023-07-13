import { stat as fsStat, readFile as fsReadFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

import { glob } from 'glob';

import { SourceNode, DataSource } from '../types';

export const NAME = 'file_system' as const;

type Options = {
  path: string;
  glob?: string;
};

export class FileSystem implements DataSource {
  private options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  async *iterable(): AsyncIterable<SourceNode> {
    const path = resolve(process.cwd(), this.options.path);

    const stat = await fsStat(path);

    if (stat.isFile()) {
      yield this.nodeFromFilePath(path);
    } else if (stat.isDirectory()) {
      const globPath = join(path, this.options.glob || '');
      const filePaths = await glob(globPath);
      for await (const filePath of filePaths) {
        yield this.nodeFromFilePath(filePath);
      }
    } else {
      throw new Error(`Invalid file or directory path "${path}"`);
    }
  }

  private async nodeFromFilePath(filePath: string) {
    const text = await fsReadFile(filePath, { encoding: 'utf8' });

    return {
      url: `file://${filePath}`,
      text: text,
    };
  }
}

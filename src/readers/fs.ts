import * as fs from 'node:fs/promises';
import * as Path from 'node:path';

import { glob } from 'glob';

import { chunk as chunkMarkdown } from '../chunking/markdown';
import { chunk as chunkText } from '../chunking/text';
import { generateId, getPathRelativeToDirectory } from '../utils';
import type { Document } from '../types';

export const NAME = 'fs' as const;

export async function* read(options: { path: string; glob?: string }) {
  const path = Path.resolve(process.cwd(), options.path);

  const stat = await fs.stat(path);

  if (stat.isFile()) {
    yield readFile(path);
  } else if (stat.isDirectory()) {
    for await (const documents of readDir(path, options.glob)) {
      yield documents;
    }
  } else {
    throw new Error(`Invalid file or directory path "${path}"`);
  }
}

async function* readDir(dirPath: string, globPath?: string) {
  globPath = Path.join(dirPath, globPath || '');

  const filePaths = await glob(globPath);
  const formatter = (filePath: string) => getPathRelativeToDirectory(filePath, dirPath);

  for await (const filePath of filePaths) {
    yield await readFile(filePath, formatter);
  }
}

async function readFile(filePath: string, formatPath = (path: string) => path) {
  const chunks = await chunk(filePath);

  const documents: Document[] = [];

  for (const chunk of chunks) {
    documents.push({
      id: generateId(),
      text: chunk,
      metadata: {
        file: formatPath(filePath),
      },
    });
  }

  return documents;
}

async function chunk(filePath: string): Promise<string[]> {
  const extname = Path.extname(filePath);
  const contents = await fs.readFile(filePath, { encoding: 'utf8' });

  switch (extname) {
    case '.md':
      return chunkMarkdown(contents);
    default:
      return chunkText(contents);
  }
}

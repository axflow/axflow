import * as fs from 'node:fs/promises';
import * as Path from 'node:path';

import chunkMarkdown from './markdown';

export default async function chunk(filePath: string): Promise<string[]> {
  const extname = Path.extname(filePath);
  const contents = await fs.readFile(filePath, { encoding: 'utf8' });

  switch (extname) {
    case '.md':
      return chunkMarkdown(contents);
    default:
      throw new Error(`Cannot chunk file with unrecognized extension "${extname}"`);
  }
}

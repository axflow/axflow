import * as Path from 'node:path';

import { glob } from 'glob';

import { createEmbedding } from './openai';
import pinecone from './pinecone';
import { generateId, zip } from './utils';
import chunk from './chunking';

export async function create() {
  await pinecone.init();
  await pinecone.createIndexIfNotExists();
}

type UpsertOptions = {
  repoPath: string;
  globPath: string;
  progressBar: {
    start(total: number, current: number): void;
    update(current: number): void;
    stop(): void;
  };
};

export async function upsert(options: UpsertOptions) {
  const { repoPath: relativeRepoPath, globPath: relativeGlobPath, progressBar } = options;

  const repoPath = Path.resolve(Path.join(__dirname, '..'), relativeRepoPath);
  const globPath = Path.join(repoPath, relativeGlobPath);
  const filePaths = await glob(globPath);

  await pinecone.init();

  let counter = 0;
  progressBar.start(filePaths.length, counter);

  for await (const filePath of filePaths) {
    const documents = await chunk(filePath);

    const { data: embeddings } = await createEmbedding({
      input: documents,
    });

    const vectors = zip(documents, embeddings).map(([document, embedding]) => ({
      id: generateId(),
      values: embedding.embedding,
      metadata: {
        file: getRelativeFilePath(filePath, repoPath),
        text: document,
      },
    }));

    const success = await pinecone.chunkedUpsert(vectors);

    if (!success) {
      throw new Error(`Failed up write ${filePath} to pinecone db`);
    }

    progressBar.update(++counter);
  }

  progressBar.stop();
}

export function getRelativeFilePath(documentPath: string, repoPath: string) {
  // Remove the leading part of the path
  documentPath = documentPath.replace(Path.dirname(repoPath), '');

  // Remove leading slashes
  const leadingSlashesRegExp = new RegExp(`^${Path.sep}+`);
  documentPath = documentPath.replace(leadingSlashesRegExp, '');

  // Normalize path separators using forward slash
  const sepRegExp = new RegExp(Path.sep, 'g');
  documentPath = documentPath.replace(sepRegExp, '/');

  return documentPath;
}

import * as Path from 'node:path';

import { glob } from 'glob';

import { createEmbedding } from './openai';
import { generateId, progressNoop, zip } from './utils';
import chunk from './chunking';
import type { VectorStore } from './types';
import { fetchDocForTerm } from './wikipedia';

type IndexingOptions = {
  repoPath: string;
  globPath: string;
  progress?: {
    start(total: number, current: number): void;
    update(current: number): void;
    stop(): void;
  };
};

export async function index(vectorStore: VectorStore, options: IndexingOptions) {
  const { repoPath: relativeRepoPath, globPath: relativeGlobPath } = options;

  const progress = options.progress || progressNoop;

  const repoPath = Path.resolve(Path.join(__dirname, '..'), relativeRepoPath);
  const globPath = Path.join(repoPath, relativeGlobPath);
  const filePaths = await glob(globPath);

  let counter = 0;
  progress.start(filePaths.length, counter);

  for await (const filePath of filePaths) {
    const documents = await chunk(filePath);

    const { data: embeddings } = await createEmbedding({
      input: documents,
    });

    const vectorizedDocuments = zip(documents, embeddings).map(([document, embedding]) => ({
      id: generateId(),
      text: document,
      embedding: embedding.embedding,
      metadata: {
        file: getRelativeFilePath(filePath, repoPath),
      },
    }));

    const success = await vectorStore.add(vectorizedDocuments);

    if (!success) {
      throw new Error(`Failed up write ${filePath} to vector store`);
    }

    progress.update(++counter);
  }

  progress.stop();
}

export async function upsertWikipedia(term: string) {
  console.log('Upserting wikipedia, got term', term);
  const directDoc = await fetchDocForTerm(term);
  if (!directDoc) {
    throw new Error(`No document found for ${term}`);
  }
  console.log(directDoc);
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

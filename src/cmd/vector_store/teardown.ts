import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { ChromaClient } from 'chromadb';
import { PineconeClient } from '@pinecone-database/pinecone';
import { getEnv, getEnvOrThrow } from '../../config';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    type: 'string',
    description: 'The vector store',
    demandOption: true,
  })
  .parseSync();

teardown(argv.store);

async function teardown(store: string) {
  switch (store) {
    case 'chroma':
      return await teardownChroma();
    case 'pinecone':
      return await teardownPinecone();
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

async function teardownChroma() {
  const client = new ChromaClient({
    path: getEnv('CHROMA_PATH'),
  });

  await client.deleteCollection({
    name: getEnvOrThrow('CHROMA_COLLECTION'),
  });
}

async function teardownPinecone() {
  const pinecone = new PineconeClient();

  await pinecone.init({
    apiKey: getEnvOrThrow('PINECONE_API_KEY'),
    environment: getEnvOrThrow('PINECONE_ENVIRONMENT'),
  });

  const index = getEnvOrThrow('PINECONE_INDEX');

  await pinecone.deleteIndex({
    indexName: index,
  });
}

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { ChromaClient } from 'chromadb';
import { PineconeClient, utils as pineconeUtils } from '@pinecone-database/pinecone';
import { getEnv, getEnvOrThrow } from '../../config';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    type: 'string',
    description: 'The vector store',
    demandOption: true,
  })
  .parseSync();

prepare(argv.store);

async function prepare(store: string) {
  switch (store) {
    case 'chroma':
      return await prepareChroma();
    case 'pinecone':
      return await preparePinecone();
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

async function prepareChroma() {
  const client = new ChromaClient({
    path: getEnv('CHROMA_PATH'),
  });

  await client.createCollection({
    name: getEnvOrThrow('CHROMA_COLLECTION'),
  });
}

async function preparePinecone() {
  const { createIndexIfNotExists } = pineconeUtils;

  const pinecone = new PineconeClient();

  await pinecone.init({
    apiKey: getEnvOrThrow('PINECONE_API_KEY'),
    environment: getEnvOrThrow('PINECONE_ENVIRONMENT'),
  });

  const index = getEnvOrThrow('PINECONE_INDEX');
  const dimension = Number(getEnvOrThrow('PINECONE_INDEX_DIMENSION'));

  return createIndexIfNotExists(pinecone, index, dimension);
}

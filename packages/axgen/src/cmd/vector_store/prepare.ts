import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Pinecone } from '../../vector_stores/pinecone';
import { Qdrant } from '../../vector_stores/qdrant';
import { SUPPORTED_VECTOR_STORES, type SupportedVectorStores } from '../../vector_stores';
import { getEnvOrThrow } from '../../config';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    choices: SUPPORTED_VECTOR_STORES,
    description: 'The vector store',
    demandOption: true,
  })
  .parseSync();

prepare(argv.store);

async function prepare(store: SupportedVectorStores) {
  switch (store) {
    case 'pinecone':
      return await Pinecone.prepare({
        apiKey: getEnvOrThrow('PINECONE_API_KEY'),
        environment: getEnvOrThrow('PINECONE_ENVIRONMENT'),
        index: getEnvOrThrow('PINECONE_INDEX'),
        dimension: Number(getEnvOrThrow('PINECONE_INDEX_DIMENSION')),
      });
    case 'qdrant':
      return await Qdrant.prepare({
        collection: getEnvOrThrow('QDRANT_COLLECTION'),
        url: getEnvOrThrow('QDRANT_URL'),
        distance: getEnvOrThrow('QDRANT_DISTANCE') as 'Cosine' | 'Euclid' | 'Dot',
        dimension: Number(getEnvOrThrow('QDRANT_DIMENSION')),
      });
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

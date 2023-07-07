import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { prepare as prepareChroma } from '../../vector_stores/chroma';
import { prepare as preparePinecone } from '../../vector_stores/pinecone';
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
      return await prepareChroma({
        path: getEnv('CHROMA_PATH'),
        collection: getEnvOrThrow('CHROMA_COLLECTION'),
      });
    case 'pinecone':
      return await preparePinecone({
        apiKey: getEnvOrThrow('PINECONE_API_KEY'),
        environment: getEnvOrThrow('PINECONE_ENVIRONMENT'),
        index: getEnvOrThrow('PINECONE_INDEX'),
        dimension: Number(getEnvOrThrow('PINECONE_INDEX_DIMENSION')),
      });
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

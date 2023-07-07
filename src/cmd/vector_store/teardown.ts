import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getEnv, getEnvOrThrow } from '../../config';
import { teardown as teardownChroma } from '../../vector_stores/chroma';
import { teardown as teardownPinecone } from '../../vector_stores/pinecone';

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
      return await teardownChroma({
        path: getEnv('CHROMA_PATH'),
        collection: getEnvOrThrow('CHROMA_COLLECTION'),
      });
    case 'pinecone':
      return await teardownPinecone({
        apiKey: getEnvOrThrow('PINECONE_API_KEY'),
        environment: getEnvOrThrow('PINECONE_ENVIRONMENT'),
        index: getEnvOrThrow('PINECONE_INDEX'),
      });
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

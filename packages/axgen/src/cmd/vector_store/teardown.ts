import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getEnvOrThrow, getEnv } from '../../config';
import { Chroma } from '../../vector_stores/chroma';
import { Pinecone } from '../../vector_stores/pinecone';
import { Qdrant } from '../../vector_stores/qdrant';
import { SUPPORTED_VECTOR_STORES, type SupportedVectorStores } from '../../vector_stores';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    choices: SUPPORTED_VECTOR_STORES,
    description: 'The vector store',
    demandOption: true,
  })
  .parseSync();

teardown(argv.store);

async function teardown(store: SupportedVectorStores) {
  switch (store) {
    case 'chroma':
      return await Chroma.teardown({
        path: getEnvOrThrow('CHROMA_PATH'),
        collection: getEnvOrThrow('CHROMA_COLLECTION'),
      });
    case 'pinecone':
      return await Pinecone.teardown({
        apiKey: getEnvOrThrow('PINECONE_API_KEY'),
        environment: getEnvOrThrow('PINECONE_ENVIRONMENT'),
        index: getEnvOrThrow('PINECONE_INDEX'),
      });
    case 'qdrant':
      return await Qdrant.teardown({
        url: getEnvOrThrow('QDRANT_URL'),
        collection: getEnvOrThrow('QDRANT_COLLECTION'),
        apiKey: getEnv('QDRANT_API_KEY'),
      });
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

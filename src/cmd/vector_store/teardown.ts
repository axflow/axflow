import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getEnv, getEnvOrThrow } from '../../config';
import { teardown as teardownChroma } from '../../vector_stores/chroma';
import { teardown as teardownPinecone } from '../../vector_stores/pinecone';
import { teardown as teardownPg } from '../../vector_stores/pgvector';
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
    case 'pgvector':
      return await teardownPg({
        tableName: getEnvOrThrow('PG_TABLE_NAME'),
        dsn: getEnvOrThrow('PG_DSN'),
      });
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

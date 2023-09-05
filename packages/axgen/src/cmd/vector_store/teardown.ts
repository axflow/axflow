import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getEnvOrThrow, getEnv } from '../../config';
import { Pinecone } from '../../vector_stores/pinecone';
import { Qdrant } from '../../vector_stores/qdrant';
import { PgVector } from '../../vector_stores/pgvector';
import { Epsilla } from '../../vector_stores/epsilla';
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
    case 'pgvector':
      return await PgVector.teardown({
        tableName: getEnvOrThrow('PG_TABLE_NAME'),
        dsn: getEnvOrThrow('PG_DSN'),
      });
    case 'epsilla':
      return await Epsilla.teardown({
        dbPath: getEnvOrThrow('EPSILLA_DB_PATH'),
        collection: getEnvOrThrow('EPSILLA_COLLECTION'),
        protocol: getEnv('EPSILLA_PROTOCOL'),
        host: getEnv('EPSILLA_HOST'),
        port: Number(getEnv('EPSILLA_PORT')),
        dbName: getEnv('EPSILLA_DB_NAME'),
      });
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

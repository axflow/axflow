import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Pinecone } from '../../vector_stores/pinecone';
import { Qdrant } from '../../vector_stores/qdrant';
import { PgVector } from '../../vector_stores/pgvector';
import { Epsilla } from '../../vector_stores/epsilla';
import { SUPPORTED_VECTOR_STORES, type SupportedVectorStores } from '../../vector_stores';
import { getEnv, getEnvOrThrow } from '../../config';

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
    case 'pgvector':
      return await PgVector.prepare({
        tableName: getEnvOrThrow('PG_TABLE_NAME'),
        dimension: Number(getEnvOrThrow('PG_VECTOR_DIMENSION')),
        dsn: getEnvOrThrow('PG_DSN'),
      });
    case 'epsilla':
      return await Epsilla.prepare({
        dbPath: getEnvOrThrow('EPSILLA_DB_PATH'),
        collection: getEnvOrThrow('EPSILLA_COLLECTION'),
        dimension: Number(getEnvOrThrow('EPSILLA_VECTOR_DIMENSION')),
        protocol: getEnv('EPSILLA_PROTOCOL'),
        host: getEnv('EPSILLA_HOST'),
        port: Number(getEnv('EPSILLA_PORT')),
        dbName: getEnv('EPSILLA_DB_NAME'),
      });
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}

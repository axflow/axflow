import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getVectorStore } from '../utils';
import { SUPPORTED_VECTOR_STORES } from '../../vector_stores';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    choices: SUPPORTED_VECTOR_STORES,
    description: 'The vector store',
    demandOption: true,
  })
  .option('ids', {
    type: 'array',
    description: 'The ids of the records to delete from the vector store',
    demandOption: true,
  })
  .parseSync();

main();

async function main() {
  const store = getVectorStore(argv.store);
  await store.delete(argv.ids as string[]);
}

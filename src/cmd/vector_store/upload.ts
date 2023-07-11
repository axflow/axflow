import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { index } from '../../indexing';
import { getReader, getVectorStore } from '../utils';
import { SUPPORTED_READERS } from '../../readers';
import { SUPPORTED_VECTOR_STORES } from '../../vector_stores';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    choices: SUPPORTED_VECTOR_STORES,
    description: 'The vector store',
    demandOption: true,
  })
  .option('reader', {
    choices: SUPPORTED_READERS,
    description: 'The data reader to use',
    demandOption: true,
  })
  .option('readerOptions', {
    type: 'string',
    description: 'JSON-serialized options for the chosen reader',
    demandOption: false,
    default: '{}',
  })
  .parseSync();

const store = getVectorStore(argv.store);
const reader = getReader(argv.reader);
const iterator = reader(JSON.parse(argv.readerOptions));

index(store, iterator);

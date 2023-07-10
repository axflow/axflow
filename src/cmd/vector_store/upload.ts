import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { index } from '../../indexing';
import { getVectorStore } from '../utils';
import { getReader, SUPPORTED_READERS } from '../../readers';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    type: 'string',
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

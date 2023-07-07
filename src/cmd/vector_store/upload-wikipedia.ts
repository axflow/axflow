import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { indexWikipedia } from '../../indexing';
import { getVectorStore } from '../utils';

const argv = yargs(hideBin(process.argv))
  .option('term', {
    type: 'string',
    description: 'Term to search wikipedia for',
    demandOption: true,
  })
  .option('store', {
    type: 'string',
    description: 'The vector store',
    demandOption: true,
  })
  .parseSync();

indexWikipedia(getVectorStore(argv.store), argv.term);

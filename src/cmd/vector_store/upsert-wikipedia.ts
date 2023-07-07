import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { upsertWikipedia } from '../../indexing';

const argv = yargs(hideBin(process.argv))
  .option('term', {
    type: 'string',
    description: 'Term to search wikipedia for',
    demandOption: true,
  })
  .parseSync();

upsertWikipedia(argv.term);

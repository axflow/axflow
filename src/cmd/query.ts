import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { run } from '../query';

const argv = yargs(hideBin(process.argv))
  .option('query', {
    alias: 'q',
    type: 'string',
    description: 'Query to execute using long term memory and a model',
    demandOption: true,
  })
  .parseSync();

run({ query: argv.query });

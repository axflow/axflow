import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { query } from '../query';

const argv = yargs(hideBin(process.argv))
  .option('query', {
    type: 'string',
    description: 'Query to execute using long term memory and a model',
    demandOption: true,
  })
  .option('model', {
    type: 'string',
    description: 'The OpenAI model to use for answering the query',
    default: 'text-ada-001',
    demandOption: false,
  })
  .parseSync();

query({ query: argv.query, model: argv.model });

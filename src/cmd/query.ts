import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { query } from '../query';
import { getVectorStore } from './utils';
import { SUPPORTED_VECTOR_STORES } from '../vector_stores';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    choices: SUPPORTED_VECTOR_STORES,
    description: 'The vector store',
    demandOption: true,
  })
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
  .option('llmOnly', {
    type: 'boolean',
    description:
      'If true, this will query the LLM without additional context from the vector database',
    default: false,
    demandOption: false,
  })
  .option('topK', {
    type: 'number',
    description:
      'The number of documents that will be fetched from the vector store and added to the context',
    default: 3,
    demandOption: false,
  })
  .parseSync();

query(getVectorStore(argv.store), {
  query: argv.query,
  model: argv.model,
  llmOnly: argv.llmOnly,
  topK: argv.topK,
});

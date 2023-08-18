import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getVectorStore } from './utils';
import { SUPPORTED_VECTOR_STORES, type SupportedVectorStores } from '../vector_stores';
import { Anthropic } from '../models';
import { OpenAIEmbedder } from '../embedders';
import { BasicPrompt, PromptWithContext } from '../prompts';
import { ANTHROPIC_QUESTION_WITHOUT_CONTEXT, ANTHROPIC_QUESTION_WITH_CONTEXT } from '../templates';

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
  .option('filterTerm', {
    type: 'string',
    description: 'Filter vectors with the given "term" key in metadata',
    default: '',
    demandOption: false,
  })
  .parseSync();

query({
  store: argv.store,
  query: argv.query,
  llmOnly: argv.llmOnly,
  topK: argv.topK,
  filterTerm: argv.filterTerm,
});

type QueryOptions = {
  store: SupportedVectorStores;
  query: string;
  llmOnly: boolean;
  topK: number;
  filterTerm: string;
};

async function query(options: QueryOptions) {
  return options.llmOnly ? completion(options) : rag(options);
}

async function completion(options: QueryOptions) {
  const { query } = options;
  const model = new Anthropic();
  const prompt = new BasicPrompt({ template: ANTHROPIC_QUESTION_WITHOUT_CONTEXT });

  const stream = model.stream(await prompt.render({ query }));

  for await (const event of stream) {
    if (event.event !== 'completion') {
      continue;
    }
    process.stdout.write(event.data.completion);
  }

  process.stdout.write('\n');
}

async function rag(options: QueryOptions) {
  const { query, topK, filterTerm } = options;

  const store = getVectorStore(options.store);
  const model = new Anthropic();
  const embedder = new OpenAIEmbedder();
  const prompt = new PromptWithContext({ template: ANTHROPIC_QUESTION_WITH_CONTEXT });

  // Grab embeddings for the query
  const embeddings = await embedder.embed(query);

  // Look up similar chunks in vector database
  const context = await store.query(embeddings[0], { topK, filterTerm });
  const ctx = context.map((ctx) => ctx.chunk.text);

  // Run the model against the original question and supplied context
  const stream = model.stream(await prompt.render({ context: ctx, query }));

  for await (const event of stream) {
    if (event.event !== 'completion') {
      continue;
    }
    process.stdout.write(event.data.completion);
  }

  process.stdout.write('\n');

  console.log('Context:');
  console.log(context.map((ctx) => ctx.id));
}

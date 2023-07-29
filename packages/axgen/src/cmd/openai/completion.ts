import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getVectorStore } from '../utils';
import { SUPPORTED_VECTOR_STORES } from '../../vector_stores';
import { OpenAICompletion } from '../../models/open-ai-completion';
import { BasicPrompt, PromptWithContext } from '../../prompts';
import { RAG } from '../../generation/rag';
import { Retriever } from '../../retrievers';
import { OpenAIEmbedder } from '../../embedders/open-ai-embedder';
import { Completion } from '../../generation/completion';
import { QUESTION_WITH_CONTEXT, QUESTION_WITHOUT_CONTEXT } from '../../templates';
import type { IVectorStore } from '../../types';

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
    description: 'The OpenAI completion model to use for answering the query',
    default: 'text-davinci-003',
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
  .option('filterTerm', {
    type: 'string',
    description: 'Filter vectors with the given "term" key in metadata',
    default: '',
    demandOption: false,
  })
  .parseSync();

query(getVectorStore(argv.store), {
  query: argv.query,
  model: argv.model,
  llmOnly: argv.llmOnly,
  topK: argv.topK,
  filterTerm: argv.filterTerm,
});

type QueryOptions = {
  query: string;
  model: string;
  llmOnly: boolean;
  topK: number;
  filterTerm: string;
};

async function query(store: IVectorStore, options: QueryOptions) {
  return options.llmOnly ? completion(options) : rag(store, options);
}

async function completion(options: QueryOptions) {
  const { model, query } = options;

  const rag = new Completion({
    model: new OpenAICompletion({ model: model, max_tokens: 256 }),
    prompt: new BasicPrompt({ template: QUESTION_WITHOUT_CONTEXT }),
  });

  const result = rag.stream(query);

  for await (const chunk of result) {
    process.stdout.write(chunk);
  }

  process.stdout.write('\n');
}

async function rag(store: IVectorStore, options: QueryOptions) {
  const { model, topK, filterTerm, query } = options;

  const rag = new RAG({
    model: new OpenAICompletion({ model: model, max_tokens: 256 }),
    prompt: new PromptWithContext({ template: QUESTION_WITH_CONTEXT }),
    retriever: new Retriever({ store: store, topK: topK, filterTerm: filterTerm }),
    embedder: new OpenAIEmbedder(),
  });

  const { result, info } = rag.stream(query);

  for await (const chunk of result) {
    process.stdout.write(chunk);
  }

  process.stdout.write('\n');

  console.log('Context:');
  console.log(info.context!.map((ctx) => ctx.id));
}

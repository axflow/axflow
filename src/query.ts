import type { VectorStore } from './types';

import { OpenAICompletion } from './models/open-ai-completion';
import { Prompt } from './prompts/prompt';
import { PromptWithContext } from './prompts/prompt-with-context';
import { RAG } from './queries/rag';
import { Retriever } from './retrieval';
import { OpenAIEmbedder } from './embedders/open-ai-embedder';
import { Completion } from './queries/completion';

const TEMPLATE_WITH_CONTEXT = `Answer the question based on the context below.

Context:
{context}

Question: {query}
Answer:`;

const TEMPLATE_WITHOUT_CONTEXT = `Answer the question based on the context below.

Question: {query}
Answer:`;

type QueryOptions = {
  query: string;
  model: string;
  llmOnly: boolean;
  topK: number;
  // TODO advanced filtering with DSL supporting operators $and, $or, $lt, $gt, $eq, $neq, $in, $nin
  // For now, hardcode to matching the 'term' field of the metadata
  filterTerm: string;
};

export async function query(store: VectorStore, options: QueryOptions) {
  return options.llmOnly ? completion(options) : rag(store, options);
}

async function completion(options: QueryOptions) {
  const { model, query } = options;

  const rag = new Completion({
    model: new OpenAICompletion({ model: model, max_tokens: 256 }),
    prompt: new Prompt({ template: TEMPLATE_WITHOUT_CONTEXT }),
  });

  const result = rag.stream(query);

  for await (const chunk of result) {
    process.stdout.write(chunk);
  }

  process.stdout.write('\n');
}

async function rag(store: VectorStore, options: QueryOptions) {
  const { model, topK, filterTerm, query } = options;

  const rag = new RAG({
    model: new OpenAICompletion({ model: model, max_tokens: 256 }),
    prompt: new PromptWithContext({ template: TEMPLATE_WITH_CONTEXT }),
    retriever: new Retriever({ store: store, topK: topK, filterTerm: filterTerm }),
    embedder: new OpenAIEmbedder(),
  });

  const result = rag.stream(query);

  for await (const chunk of result) {
    process.stdout.write(chunk);
  }

  process.stdout.write('\n');
}

import { createCompletion, createEmbedding } from './openai';

import type { VectorStore } from './types';
import { formatTemplate } from './utils';

const TEMPLATE_WITH_CONTEXT = `Answer the question based on the context below.

Context:
{context}

Question: {question}
Answer:`;

const TEMPLATE_WITHOUT_CONTEXT = `Answer the question based on the context below.

Question: {question}
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

export async function query(vectorStore: VectorStore, options: QueryOptions) {
  const { query, model, llmOnly, topK, filterTerm } = options;

  let prompt: string;

  if (llmOnly) {
    console.log(`Querying ${model} without additional context`);
    prompt = formatTemplate(TEMPLATE_WITHOUT_CONTEXT, { question: query });
  } else {
    const { results, context } = await getContext(vectorStore, query, topK, filterTerm);

    console.log(`Querying ${model} with additional context`);
    console.log(
      results.map((r) => ({
        id: r.id,
        text: `<${r.chunk.text.length} characters>`,
        metadata: r.chunk.metadata,
      }))
    );

    prompt = formatTemplate(TEMPLATE_WITH_CONTEXT, { context: context, question: query });
  }

  const results = await createCompletion({ model, prompt: prompt });

  console.log();
  console.log(`--- ${model} completion:`);
  console.log();
  console.log(results[0].text?.trim());
}

async function getContext(
  vectorStore: VectorStore,
  query: string,
  topK: number,
  filterTerm: string
) {
  const embedding = await createEmbedding({ input: query });

  const results = await vectorStore.query({
    topK,
    embedding: embedding.data[0].embedding,
    filterTerm,
  });

  const context = results.map((result) => result.chunk.text).join('\n\n---\n\n');

  return { results, context };
}

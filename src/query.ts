import { createCompletion, createEmbedding } from './openai';

import type { VectorStore } from './types';

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

  const prompt = ['Answer the question based on the markdown context below.'];

  if (llmOnly) {
    console.log(`Querying ${model} without additional context`);
  } else {
    const { results, context } = await getContext(vectorStore, query, topK, filterTerm);

    console.log(`Querying ${model} with additional context`);
    console.log(
      results.map((r) => ({
        id: r.id,
        text: `<${r.document.text.length} characters>`,
        metadata: r.document.metadata,
      }))
    );

    prompt.push('\n\nContext:\n');
    prompt.push(context);
  }

  prompt.push(`\n\nQuestion: ${query}`);
  prompt.push('\nAnswer:');

  const results = await createCompletion({ model, prompt: prompt.join('') });

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

  const context = results.map((result) => result.document.text).join('\n\n---\n\n');

  return { results, context };
}

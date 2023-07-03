import pinecone from './pinecone';
import { createCompletion, createEmbedding } from './openai';

type QueryOptions = {
  query: string;
  model: string;
  llmOnly: boolean;
};

export async function query(options: QueryOptions) {
  await pinecone.init();

  const query = options.query;
  const model = options.model;
  const llmOnly = options.llmOnly;

  const prompt = ['Answer the question based on the markdown context below.'];

  if (llmOnly) {
    console.log(`Querying ${model} without additional context`);
  } else {
    const { matches, context } = await getContext(query);

    console.log(`Querying ${model} with additional context`);
    console.log(matches.map((c) => ({ id: c.id, score: c.score, file: c.metadata.file })));

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

async function getContext(query: string) {
  const embedding = await createEmbedding({ input: query });

  const { matches: maybeMatches } = await pinecone.query({
    topK: 3,
    vector: embedding.data[0].embedding,
    includeMetadata: true,
  });

  const matches = (maybeMatches || []).map((match) => {
    const metadata = match.metadata as { file: string; text: string };
    return { id: match.id, score: match.score, metadata: metadata };
  });

  const context = matches.map((match) => match.metadata.text).join('\n\n---\n\n');

  return { matches, context };
}

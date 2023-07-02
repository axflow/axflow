import { Configuration, OpenAIApi } from 'openai';
import type { CreateCompletionRequest, CreateEmbeddingRequest } from 'openai';
import { getEnv } from './config';

const EMBEDDING_MODEL = 'text-embedding-ada-002';
const COMPLETION_MODEL = 'text-curie-001';

const client = new OpenAIApi(
  new Configuration({
    apiKey: getEnv('OPENAI_API_KEY'),
  })
);

export async function createEmbedding(
  options: Partial<CreateEmbeddingRequest> & { input: string | string[] }
) {
  const response = await client.createEmbedding({
    model: EMBEDDING_MODEL,
    ...options,
  });

  return response.data;
}

export async function createCompletion(
  options: Partial<CreateCompletionRequest> & { prompt: string }
) {
  const response = await client.createCompletion({
    model: COMPLETION_MODEL,
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
    ...options,
  });

  return response.data.choices;
}

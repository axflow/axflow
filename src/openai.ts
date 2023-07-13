import { Configuration, OpenAIApi } from 'openai';
import type { CreateCompletionRequest } from 'openai';
import { getEnvOrThrow } from './config';

const client = new OpenAIApi(
  new Configuration({
    apiKey: getEnvOrThrow('OPENAI_API_KEY'),
  })
);

export async function createEmbedding(options: {
  input: string | string[];
  model?: string;
  user?: string;
}) {
  const response = await client.createEmbedding({
    model: 'text-embedding-ada-002',
    ...options,
  });

  return response.data;
}

export async function createCompletion(options: CreateCompletionRequest) {
  const response = await client.createCompletion({
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

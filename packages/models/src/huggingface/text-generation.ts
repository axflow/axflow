import { POST } from '@axflow/models/utils';

// With Hugging Face, we need to first choose a "task" and then pick a compatible model.
// The tasks we are using (for llama2 for instance): 'text-generation'
// https://huggingface.co/models?pipeline_tag=conversational

// https://huggingface.co/docs/api-inference/quicktour#running-inference-with-api-requests
const HF_MODEL_API_URL = 'https://api-inference.huggingface.co/models/';
// const SUPPORTED_MODELS = ['gpt2'];

function headers(accessToken?: string) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
  };
  if (typeof accessToken === 'string') {
    headers.authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

export namespace HfChatTypes {
  // https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
  export type Request = {
    model: string;
    stream?: boolean;
    inputs: string;
    parameters?: {
      top_k?: number;
      top_p?: number;
      // Float range from 0.00 to 100.00. Default is 1.0
      temperature?: number;
      repetition_penalty?: number;
      max_new_tokens?: number;
      // In seconds
      max_time?: number;
      return_full_text?: boolean;
      num_return_sequences?: number;
      do_sample?: boolean;
    };
    options?: {
      use_cache?: boolean;
      wait_for_model?: boolean;
    };
  };

  export type RequestOptions = {
    accessToken?: string;
    apiUrl?: string;
    fetch?: typeof fetch;
  };

  export type GeneratedText = {
    generated_text: string;
  };
  // https://huggingface.co/docs/api-inference/detailed_parameters#text-generation-task
  export type Response = GeneratedText | GeneratedText[];
}

async function run(
  request: HfChatTypes.Request,
  options: HfChatTypes.RequestOptions
): Promise<HfChatTypes.Response> {
  // TODO validate the model is supported
  const url = options.apiUrl || HF_MODEL_API_URL + request.model;

  const response = await POST(url, {
    headers: headers(options.accessToken),
    body: JSON.stringify({ ...request }),
    fetch: options.fetch,
  });

  return response.json();
}

// async function stream(
//   request: HfChatTypes.Request,
//   options: HfChatTypes.RequestOptions
// ): Promise<ReadableStream<HfChatTypes.Response>> {
//   return Promise.resolve();
// }

export class HfGeneration {
  static run = run;
  // static stream = stream;
}

import { GoogleAuth, type GoogleAuthOptions } from 'google-auth-library';

import { IDataEmbedder } from '../types';
import { wrap } from '../utils';
import { request } from '../models/vertexai/utils';

export const NAME = 'vertexai' as const;

namespace VertexAIEmbedderTypes {
  export type Options = {
    location?: string;
    endpoint?: string;
    auth?: GoogleAuthOptions;
  };

  export type Prediction = {
    embeddings: {
      values: number[];
      statistics: {
        token_count: number;
        truncated: boolean;
      };
    };
  };

  export type Response = {
    predictions: Prediction[];
  };
}

export type VertexAIEmbedderOptions = VertexAIEmbedderTypes.Options;

export class VertexAIEmbedder implements IDataEmbedder {
  private readonly location: string;
  private readonly endpoint: string;
  private readonly auth: GoogleAuth;

  constructor(options?: VertexAIEmbedderOptions) {
    options = options || {};
    this.location = options.location || 'us-central1';
    this.endpoint = options.endpoint || 'us-central1-aiplatform.googleapis.com';
    this.auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
      ...options.auth,
    });
  }

  async embed(input: string | string[]) {
    const requests: { content: string }[][] = [];

    // Google only allows 5 instances per embeddings request
    const MAX_GROUP_SIZE = 5;

    for (let i = 0, group = 0, count = 0, inputs = wrap(input); i < inputs.length; i++, count++) {
      if (count === MAX_GROUP_SIZE) {
        count = 0;
        group += 1;
      }
      requests[group] = requests[group] || [];
      const request = requests[group];
      request.push({ content: inputs[i] });
    }

    let embeddings: number[][] = [];

    // Seeing rate limits with google so running these synchronously
    for (const instances of requests) {
      const { data } = await request<VertexAIEmbedderTypes.Response>(
        { instances },
        {
          auth: this.auth,
          endpoint: this.endpoint,
          location: this.location,
          model: 'textembedding-gecko',
        }
      );
      const values = data.predictions.map((prediction) => prediction.embeddings.values);

      embeddings = embeddings.concat(values);
    }

    return embeddings;
  }
}

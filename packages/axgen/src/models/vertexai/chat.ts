import { GoogleAuth } from 'google-auth-library';
import { request } from './utils';

import type { IModel } from '../../types';
import type { ParametersType, CitationType, SafetyAttributeType, OptionsType } from './types';

export namespace VertexAIChatTypes {
  export type Options = OptionsType;
  export type Parameters = ParametersType;

  export interface Instance {
    context?: string;
    examples?: [
      {
        input: { content: string };
        output: { content: string };
      }
    ];
    messages: [
      {
        author: string;
        content: string;
      }
    ];
  }

  export interface Input {
    instances: Instance[];
    parameters?: ParametersType;
  }

  export type Candidate = {
    author: string;
    content: string;
  };

  export type Prediction = {
    candidates: Candidate[];
    citationMetadata: {
      citations: CitationType[];
    };
    safetyAttributes: SafetyAttributeType[];
  };

  export interface Response {
    predictions: Prediction[];
  }
}

/**
 * https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text-chat
 */
export class VertexAIChat
  implements IModel<VertexAIChatTypes.Instance[], VertexAIChatTypes.Response>
{
  private readonly endpoint: string;
  private readonly location: string;
  private readonly auth: GoogleAuth;
  private readonly parameters: VertexAIChatTypes.Parameters;

  constructor(options?: VertexAIChatTypes.Options) {
    options = options || {};
    this.parameters = Object.assign({ maxOutputTokens: 200 }, options.parameters);
    this.location = options.location || 'us-central1';
    this.endpoint = options.endpoint || 'us-central1-aiplatform.googleapis.com';
    this.auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
      ...options.auth,
    });
  }

  async run(instances: VertexAIChatTypes.Instance[]) {
    const { data } = await request<VertexAIChatTypes.Response>(
      { instances, parameters: this.parameters },
      { auth: this.auth, endpoint: this.endpoint, location: this.location, model: 'chat-bison' }
    );
    return data;
  }

  stream(_instances: VertexAIChatTypes.Instance[]): AsyncIterable<VertexAIChatTypes.Response> {
    throw new Error(`Streaming is not implemented for ${this.constructor.name}`);
  }
}

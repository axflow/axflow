import { GoogleAuth } from 'google-auth-library';
import { request } from './utils';

import type { IModel } from '../../types';
import type { ParametersType, CitationType, SafetyAttributeType, OptionsType } from './types';

export namespace VertexAITextTypes {
  export type Options = OptionsType;
  export type Parameters = ParametersType;

  export interface Instance {
    prompt: string;
  }

  export interface Input {
    instances: Instance[];
    parameters?: ParametersType;
  }

  export type Prediction = {
    content: string;
    citationMetadata: {
      citations: CitationType[];
    };
    safetyAttributes: SafetyAttributeType;
  };

  export interface Response {
    predictions: Prediction[];
  }
}

/**
 * https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text
 */
export class VertexAIText
  implements IModel<VertexAITextTypes.Instance[], VertexAITextTypes.Response>
{
  private readonly endpoint: string;
  private readonly location: string;
  private readonly auth: GoogleAuth;
  private readonly parameters: VertexAITextTypes.Parameters;

  constructor(options?: VertexAITextTypes.Options) {
    options = options || {};
    this.parameters = Object.assign({ maxOutputTokens: 200 }, options.parameters);
    this.location = options.location || 'us-central1';
    this.endpoint = options.endpoint || 'us-central1-aiplatform.googleapis.com';
    this.auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
      ...options.auth,
    });
  }

  async run(instances: VertexAITextTypes.Instance[]) {
    const { data } = await request<VertexAITextTypes.Response>(
      { instances, parameters: this.parameters },
      { auth: this.auth, endpoint: this.endpoint, location: this.location, model: 'text-bison' }
    );

    return data;
  }

  stream(_instances: VertexAITextTypes.Instance[]): AsyncIterable<VertexAITextTypes.Response> {
    throw new Error(`Streaming is not implemented for ${this.constructor.name}`);
  }
}

import type { GoogleAuthOptions } from 'google-auth-library';

export type ParametersType = {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
};

export type CitationType = {
  startIndex: number;
  endIndex: number;
  url: string;
  title: string;
  license: string;
  publicationDate: string;
};

export type SafetyAttributeType = {
  blocked: boolean;
  scores: number[];
  categories: string[];
};

export type OptionsType = {
  location?: string;
  endpoint?: string;
  auth?: GoogleAuthOptions;
  parameters?: ParametersType;
};

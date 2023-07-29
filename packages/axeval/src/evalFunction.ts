import { OpenAIChat, SUPPORTED_OPENAI_CHAT_MODELS } from './model';
import { RUBRIC_SYSTEM_MESSAGE, makeUserRubricMessage, RubricResponse } from './prompt';

export interface EvalFunction {
  description: string;
  id: string;
  options?: Record<string, any>;
  run: (response: string, idealOutput: string) => Promise<number>;
}

export abstract class BaseEvalFunction implements EvalFunction {
  description: string;
  id: string;

  constructor(description: string) {
    this.description = description;
    this.id = 'base';
  }

  abstract run(response: string, idealOutput: string): Promise<number>;
}

export class IsValidJson extends BaseEvalFunction {
  id = 'is-valid-json';
  constructor() {
    super('Check if response is valid JSON');
  }

  run(response: string): Promise<number> {
    try {
      JSON.parse(response);
      return Promise.resolve(1);
    } catch {
      return Promise.resolve(0);
    }
  }
}

type MatchOptions = {
  trim: boolean;
  caseSensitive: boolean;
};

export class Match extends BaseEvalFunction {
  id = 'match';
  options: MatchOptions;

  constructor(opts?: MatchOptions) {
    super('Check if response exactly matches ideal output');
    // The defaults are strict, to prevent false positives.
    const defaults = {
      trim: false,
      caseSensitive: true,
    };
    this.options = Object.assign(defaults, opts);
  }

  run(response: string, idealOutput: string): Promise<number> {
    response = this.options.trim ? response.trim() : response;
    response = this.options.caseSensitive ? response : response.toLowerCase();
    return Promise.resolve(response === idealOutput ? 1 : 0);
  }
}

export class Includes extends BaseEvalFunction {
  id = 'includes';
  constructor() {
    super('Check if response includes ideal output');
  }

  run(response: string, idealOutput: string): Promise<number> {
    return Promise.resolve(response.includes(idealOutput) ? 1 : 0);
  }
}

export class LLMRubric extends BaseEvalFunction {
  id = 'llm-rubric';
  client: OpenAIChat;
  rubric: string;

  constructor(chatModel: SUPPORTED_OPENAI_CHAT_MODELS, rubric: string) {
    super('Have an LLM take the response and evaluate it');
    this.client = new OpenAIChat(chatModel);
    this.rubric = rubric;
  }

  // TODO fix this. We should have typed options with a Record<string, any> on the base class
  async run(response: string) {
    const llmResponse = await this.client.run([
      RUBRIC_SYSTEM_MESSAGE,
      makeUserRubricMessage(response, this.rubric),
    ]);
    try {
      const responseparsedResponse: RubricResponse = JSON.parse(llmResponse);
      return responseparsedResponse.pass ? 1 : 0;
    } catch {
      // The LLM didn't respond with valid JSON. Maybe we can handle this better
      return 0;
    }
  }
}

import { OpenAIChat, SUPPORTED_OPENAI_CHAT_MODELS } from './model';
import { RUBRIC_SYSTEM_MESSAGE, makeUserRubricMessage, RubricResponse } from './prompt';

export interface Evaluator {
  id: string;
  description: string;
  options?: Record<string, any>;
  expected: string;
  run(response: string): Promise<number>;
}

export function isValidJson() {
  return new IsValidJson();
}

class IsValidJson implements Evaluator {
  id = 'is-valid-json';
  description = 'Check if response is valid JSON';

  get expected() {
    return 'Response to be valid JSON';
  }

  async run(response: string) {
    try {
      JSON.parse(response);
      return 1;
    } catch {
      return 0;
    }
  }
}

type MatchOptions = {
  trim?: boolean;
  caseSensitive?: boolean;
};

export function match(value: string, options?: MatchOptions) {
  return new Match(value, options);
}

class Match implements Evaluator {
  id = 'match';
  description = 'Check if response exactly matches ideal output';
  options: MatchOptions;

  private value: string;

  constructor(value: string, opts?: MatchOptions) {
    // The defaults are strict, to prevent false positives.
    const defaults = {
      trim: false,
      caseSensitive: true,
    };

    this.value = value;
    this.options = Object.assign(defaults, opts);
  }

  get expected() {
    return `Response to equal: ${JSON.stringify(this.value)}`;
  }

  async run(response: string) {
    response = this.options.trim ? response.trim() : response;
    response = this.options.caseSensitive ? response : response.toLowerCase();
    return response === this.value ? 1 : 0;
  }
}

export function includes(value: string) {
  return new Includes(value);
}

class Includes implements Evaluator {
  id = 'includes';
  description = 'Check if response includes ideal output';

  private value: string;

  constructor(value: string) {
    this.value = value;
  }

  get expected() {
    return `Response to include: ${JSON.stringify(this.value)}`;
  }

  async run(response: string) {
    return response.includes(this.value) ? 1 : 0;
  }
}

export function llmRubric(chatModel: SUPPORTED_OPENAI_CHAT_MODELS, rubric: string) {
  return new LLMRubric(chatModel, rubric);
}

class LLMRubric implements Evaluator {
  id = 'llm-rubric';
  description = 'Have an LLM take the response and evaluate it';

  private client: OpenAIChat;
  private rubric: string;

  constructor(chatModel: SUPPORTED_OPENAI_CHAT_MODELS, rubric: string) {
    this.client = new OpenAIChat(chatModel);
    this.rubric = rubric;
  }

  get expected() {
    return `Response to adhere to the following rubric: ${JSON.stringify(this.rubric)}`;
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

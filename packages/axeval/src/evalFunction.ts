export interface EvalFunction {
  description: string;
  run: (response: string, idealOutput: string) => number;
}

export abstract class BaseEvalFunction implements EvalFunction {
  description: string;

  constructor(description: string) {
    this.description = description;
  }

  abstract run(response: string, idealOutput: string): number;
}

export class IsValidJson extends BaseEvalFunction {
  constructor() {
    super('Check if response is valid JSON');
  }

  run(response: string): number {
    try {
      JSON.parse(response);
      return 1;
    } catch {
      return 0;
    }
  }
}

type MatchOptions = {
  trim: boolean;
  caseSensitive: boolean;
};
export class Match extends BaseEvalFunction {
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

  run(response: string, idealOutput: string): number {
    response = this.options.trim ? response.trim() : response;
    response = this.options.caseSensitive ? response : response.toLowerCase();
    return response === idealOutput ? 1 : 0;
  }
}

export class Includes extends BaseEvalFunction {
  constructor() {
    super('Check if response includes ideal output');
  }

  run(response: string, idealOutput: string): number {
    return response.includes(idealOutput) ? 1 : 0;
  }
}

export class IsValidJSON extends BaseEvalFunction {
  constructor() {
    super('Check if response is valid JSON');
  }

  run(response: string): number {
    try {
      JSON.parse(response);
      return 1;
    } catch {
      return 0;
    }
  }
}

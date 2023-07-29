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

export class Match extends BaseEvalFunction {
  constructor() {
    super('Check if response exactly matches ideal output');
  }

  run(response: string, idealOutput: string): number {
    return response.toLowerCase() === idealOutput.toLowerCase() ? 1 : 0;
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

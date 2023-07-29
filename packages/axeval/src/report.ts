import chalk from 'chalk';
import type { EvalResult } from './evalResult';

const ONE_SECOND_IN_MS = 1000;
const TEN_SECONDS_IN_MS = 10000;
const ONE_MINUTE_IN_MS = 60000;

function formatMs(ms: number) {
  if (ms < ONE_SECOND_IN_MS) {
    return `${ms} ms`;
  } else if (ms < TEN_SECONDS_IN_MS) {
    const n = (ms / ONE_SECOND_IN_MS).toFixed(3);
    return `${n} s`;
  } else if (ms < ONE_MINUTE_IN_MS) {
    const n = Math.round(ms / ONE_SECOND_IN_MS);
    return `${n} s`;
  } else {
    const n = (ms / ONE_MINUTE_IN_MS).toFixed(3);
    return `${n} mins`;
  }
}

export interface EvalCaseReport {
  print: () => string;
}

export class DefaultEvalCaseReport implements EvalCaseReport {
  constructor(private result: EvalResult) {}
  print() {
    const { success, response, evalFunction, score, evalCase, latencyMs } = this.result;

    const timeDisplay = `${formatMs(latencyMs)}`;
    const successString = success ? chalk.green('passed') : chalk.red('failed');
    const firstLine = evalCase.description ? `\nTest:                 ${evalCase.description}` : ``;
    return (
      firstLine +
      `
EvalFunction:         ${evalFunction.id}
Prompt:               ${JSON.stringify(evalCase.prompt)}
Expected Output:      ${evalCase.idealOutput}
LLM Response:         ${response?.output?.trim()}
Score:                ${score} (${successString})
Time:                 ${timeDisplay}`
    );
  }
}

export class MatchReport implements EvalCaseReport {
  constructor(private result: EvalResult) {}
  print() {
    const { success, response, evalFunction, score, evalCase, latencyMs } = this.result;

    const timeDisplay = `${formatMs(latencyMs)}`;
    const successString = success ? chalk.green('passed') : chalk.red('failed');
    const firstLine = evalCase.description ? `\nTest:                 ${evalCase.description}` : ``;
    return (
      firstLine +
      `
EvalFunction:         match
Params:               ${JSON.stringify(evalFunction.options)}
Prompt:               ${JSON.stringify(evalCase.prompt)}
LLM Response:         ${response?.output?.trim()}
Score:                ${score} (${successString})
Time:                 ${timeDisplay}`
    );
  }
}

export class LLMRubricReport implements EvalCaseReport {
  constructor(private result: EvalResult) {}
  print() {
    const { success, response, score, evalFunction, evalCase, latencyMs } = this.result;

    const timeDisplay = `${formatMs(latencyMs)}`;
    const successString = success ? chalk.green('passed') : chalk.red('failed');
    const firstLine = evalCase.description ? `\nTest:                 ${evalCase.description}` : ``;
    return (
      firstLine +
      `
EvalFunction:         ${evalFunction.id}
Prompt:               ${JSON.stringify(evalCase.prompt)}
LLM Response:         ${response?.output?.trim()}
Score:                ${score} (${successString})
Time:                 ${timeDisplay}`
    );
  }
}

export class Report {
  description: string;
  timeMs: number;
  results: EvalResult[];
  passed: EvalResult[];
  failed: EvalResult[];

  constructor(options: { description: string; timeMs: number; results: EvalResult[] }) {
    this.description = options.description;
    this.timeMs = options.timeMs;
    this.results = options.results;
    this.passed = this.results.filter((result) => result.success);
    this.failed = this.results.filter((result) => !result.success);
  }

  evalResultToString(result: EvalResult): string {
    switch (result.evalFunction.id) {
      case 'llm-rubric':
        return new LLMRubricReport(result).print();
      case 'match':
        return new MatchReport(result).print();
      default:
        return new DefaultEvalCaseReport(result).print();
    }
  }

  toString(verbose: boolean = false) {
    let resultsString = '';
    if (verbose) {
      resultsString = this.results.map((result) => this.evalResultToString(result)).join('\n');
    }
    const passCount = this.passed.length;
    const failCount = this.failed.length;

    const testsDisplay = [];

    if (failCount > 0) {
      testsDisplay.push(chalk.red(`${failCount} failed`));
    }

    if (passCount > 0) {
      testsDisplay.push(chalk.green(`${passCount} passed`));
    }

    testsDisplay.push(`${this.results.length} total`);

    const summary = `
Suite:       ${this.description}
Tests:       ${testsDisplay.join(', ')}
Time:        ${formatMs(this.timeMs)}\n`;
    return verbose ? resultsString + '\n' + summary : summary;
  }
}

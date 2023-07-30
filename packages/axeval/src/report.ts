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

class LogInfoFormatter {
  constructor(private titleLength: number) {}

  format(title: string, value: any, options: { stringify?: boolean } = {}) {
    if (value === undefined || value === null) {
      return '';
    }

    title = `${title}:`.padEnd(this.titleLength);
    value = options.stringify === true ? JSON.stringify(value) : value;

    return title + value + '\n';
  }
}

export class Report {
  description: string;
  timeMs: number;
  results: EvalResult[];
  passed: EvalResult[];
  failed: EvalResult[];

  private resultFormatter: LogInfoFormatter;

  constructor(options: { description: string; timeMs: number; results: EvalResult[] }) {
    this.description = options.description;
    this.timeMs = options.timeMs;
    this.results = options.results;
    this.passed = this.results.filter((result) => result.success);
    this.failed = this.results.filter((result) => !result.success);
    this.resultFormatter = new LogInfoFormatter(25);
  }

  evalResultToString(result: EvalResult): string {
    const { success, response, evaluator, score, evalCase, latencyMs } = result;

    const successString = success ? chalk.green('passed') : chalk.red('failed');

    let str = '';

    str += this.resultFormatter.format('Test', evalCase.description);
    str += this.resultFormatter.format('Evaluator', evaluator.id);
    str += this.resultFormatter.format('Params', evaluator.options, { stringify: true });
    str += this.resultFormatter.format('Prompt', evalCase.prompt, { stringify: true });
    str += this.resultFormatter.format('Expected', evaluator.expected);
    str += this.resultFormatter.format('LLM Response', response?.output, { stringify: true });
    str += this.resultFormatter.format('Score', `${score} (${successString})`);
    str += this.resultFormatter.format('Time', formatMs(latencyMs));

    return str;
  }

  toString(verbose: boolean = false) {
    let resultsString = '';
    if (verbose) {
      resultsString = this.results.map((result) => this.evalResultToString(result)).join('\n\n');
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

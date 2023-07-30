import * as Path from 'node:path';
import * as fs from 'node:fs/promises';
import { OpenAIChatMessage, OpenAIChat } from '../src/model';
import { match } from '../src/evaluators';
import { Runner } from '../src/runner';

import type { EvalCase } from '../src/evalCase';

main();

async function main() {
  const testFile = Path.resolve(__dirname, 'tests.jsonld');
  const tests = await getTestsFromFilePath(testFile);

  // Create a test runner
  const runner = new Runner({ verbose: true });

  // Register a suite of tests (in this case, from the tests.jsonld file)
  const model = new OpenAIChat('gpt-4', { max_tokens: 300 });
  runner.register('Simple test suite of chat examples', model, tests);

  // Run the tests
  return runner.run();
}

async function getTestsFromFilePath(path: string) {
  const jsonlds = await readJsonL(path);

  return jsonlds.map((data) => {
    const evalCase: EvalCase = {
      description: data.description,
      prompt: data.input,
      evaluation: match(data.ideal, { trim: true, caseSensitive: false }),
    };

    return evalCase;
  });
}

interface JsonLDChat {
  input: OpenAIChatMessage[];
  ideal: string;
  threshhold: number;
  description?: string;
}

async function readJsonL(file: string): Promise<JsonLDChat[]> {
  const jsonld = await fs.readFile(file, { encoding: 'utf8' });
  const lines = jsonld.split('\n');
  return lines.filter((line) => !!line.trim()).map((line) => JSON.parse(line));
}

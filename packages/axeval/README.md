# Axeval - a TypeScript evaluation & unit testing framework for LLMs

This is a foundational framework that enables test-driven LLM engineering, and can be used for various evaluation use cases:

- creating unit tests for your prompts
- iterating on prompts with data driven measurements
- evaluating different models on latency / cost / accuracy to make the optimal production decision

In essence, axeval is a way to execute and fine-tune your prompts and evaluation functions for TypeScript.

Axeval is a code-first library, rather than configuration-first.

## Installing

```
npm i axeval
```

## Concepts

Axeval was built to model the concepts of a unit testing framework like Jest, and should feel familiar. We have a set of `EvalCases`, which evaluate prompts against models and product `EvalResults`. They get run in a `Suite`, and produce a `Report`.

### [EvalCase](./src/evalCase.ts)

This is similar to a unit testCase. It contains a prompt, the evalFunctions (see below), and any options.

### [EvalFunction](./src/evalFunction.ts)

Given a prompt and a response from an LLM to that prompt, produces a score from 0 to 1. Examples include:

- match
- includes
- isValidJSON
- LLMRubric
  ...

You can use our evalFunctions or write your own easily.

### [EvalResult](./src/evalResult.ts)

The result of applying an `EvalFunction` to an `EvalCase`. It contains all the metadata like score, latency, response, errror, prompt,...

### [Suite](./src/suite.ts)

Similar to a jest test suite. It is configured with: a model, a set of `evalCases`. It's `run()` method produces a `report` (see below).

### [Report](./src/report.ts)

A structured object containing all of the `EvalResults` for a given `TestSuite` run. It can output this to different formats, like for example stdout.

## Example

You can find full examples in the [example directory](./example), here is a completion `TestSuite` run with a few different `EvalCases`, that runs twice (once against chatGPT and then against Anthropic's Claude).

```typescript
import { Match, Includes, IsValidJson, LLMRubric } from '../src/evalFunction';
import { CompletionEvalCase } from '../src/evalCase';
import { AnthropicCompletion, OpenAICompletion } from '../src/model';
import { CompletionTestSuite } from '../src/suite';

const dataset: CompletionEvalCase[] = [
  {
    description: 'Football world cup completion',
    prompt: 'Who won the 1998 football world cup? Respond concisly',
    idealOutput: 'France',
    evalFunctions: [new Match(), new Includes()],
  },
  {
    description: 'American history knowledge completion',
    prompt: 'Finish this sentence, the first US president was',
    idealOutput: 'George Washington',
    evalFunctions: [new Match(), new Includes()],
  },
  {
    description: 'Basic math completion',
    prompt: 'What is the result of 2 x 4 + 6 =',
    idealOutput: '14',
    evalFunctions: [new Match(), new Includes()],
  },
  {
    description: 'Generate valid JSON',
    prompt:
      'We have a Person object with the fields name, age, and children. Produce a valid JSON object for a family with 2 parents and 1 chil. You can invent the names and ages. Respond with ONLY the JSON object, nothing else.',
    idealOutput: '',
    evalFunctions: [new IsValidJson()],
  },
  {
    description: 'Can the LLM be mean!?',
    prompt: 'Say something rude and insulting to me',
    // Hmm we should make this optional
    idealOutput: '',
    evalFunctions: [new LLMRubric('gpt-4', 'is an insulting response')],
  },
  {
    description: 'Empathetic helper',
    prompt: 'I dont feel too good today...',
    // Hmm we should make this optional
    idealOutput: '',
    evalFunctions: [new LLMRubric('gpt-4', 'is supportive and empathetic')],
  },
];

async function main() {
  // As an example, let's make Claude creative with a temperature of 1
  const claude2 = new AnthropicCompletion('claude-2', { temperature: 1 });
  const davinci3 = new OpenAICompletion('text-davinci-003');

  const suites = [
    new CompletionTestSuite('Claude2 completion', claude2, dataset),
    new CompletionTestSuite('text-davinci-003 completion', davinci3, dataset),
  ];

  const runningSuites = suites.map(async (suite) => {
    const report = await suite.run();
    console.log(report.toString(true));
  });

  return Promise.all(runningSuites);
}

main();
```

This would produce the following report (truncated for space):

<p align="center">
  <img src="./assets/report-stdout.png" />
</p>

## License

[MIT](LICENSE.md)

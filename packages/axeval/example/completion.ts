import { Match, Includes, IsValidJSON } from "../src/evalFunction";
import { CompletionEvalCase } from "../src/evalCase";
import { AnthropicCompletion, OpenAICompletion } from "../src/model";
import { CompletionTestSuite } from "../src/suite";

const dataset: CompletionEvalCase[] = [
  {
    prompt: "Who won the 1998 football world cup? Respond concisly",
    idealOutput: "France",
    evalFunctions: [new Match(), new Includes()],
  },
  {
    prompt: "Finish this sentence, the first US president was",
    idealOutput: "George Washington",
    evalFunctions: [new Match(), new Includes()],
  },
  {
    prompt: "What is the result of 2 x 4 + 6 =",
    idealOutput: "14",
    evalFunctions: [new Match(), new Includes()],
  },
  {
    description: "Generate valid JSON",
    prompt:
      "We have a Person object with the fields name, age, and children. Produce a valid JSON object for a family with 2 parents and 3 children. You can invent the names and ages. Respond with ONLY the JSON object, nothing else.",
    idealOutput: "",
    evalFunctions: [new IsValidJSON()],
  },
];

async function main() {
  // As an example, let's make Claude creative with a temperature of 1
  const claude2 = new AnthropicCompletion("claude-2", { temperature: 1 });
  const davinci3 = new OpenAICompletion("text-davinci-003");

  const suites = [
    new CompletionTestSuite("Claude2 completion", claude2, dataset),
    new CompletionTestSuite("text-davinci-003 completion", davinci3, dataset),
  ];

  const runningSuites = suites.map(async (suite) => {
    const report = await suite.run();
    console.log(report.toString(true));
  });

  return Promise.all(runningSuites);
}

main();

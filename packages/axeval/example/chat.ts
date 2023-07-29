import * as Path from "node:path";
import fs from "fs";
import readline from "readline";
import { ChatTestSuite } from "../src/suite";
import { OpenAIChatCompletion, OpenAIChatCompletionMessageInput } from "axgen";
import { ChatEvalCase } from "../src/evalCase";
import { Match } from "../src/evalFunction";

interface JsonLDChat {
  input: OpenAIChatCompletionMessageInput[];
  ideal: string;
  threshhold: number;
}

async function readJsonL(file: string): Promise<JsonLDChat[]> {
  const fileStream = fs.createReadStream(file);
  const rl = readline.createInterface({ input: fileStream });

  const data: JsonLDChat[] = [];
  for await (const line of rl) {
    data.push(JSON.parse(line));
  }

  return data;
}

const evalModel = {
  run: async (messages: OpenAIChatCompletionMessageInput[]) => {
    const chatModel = new OpenAIChatCompletion({
      model: "gpt-4",
      max_tokens: 1000,
    });
    const result = await chatModel.run(messages);
    return result.choices[0].message.content || "";
  },
};

/**
/* This is the first test for the library, let's try this:
/* 1. Read files from disk
/* 2. Create test suite
/* 3. Create EvalCases -> Dataset
/* 4. Register EvalFunctions
/* 5. Run!
/* 6. Print evalResults
 *
 */
const chatTestRun = async () => {
  const path = Path.resolve(__dirname, "tests.jsonld");
  const files = await readJsonL(path);

  // Chat Dataset
  const dataset: ChatEvalCase[] = files.map((data) => {
    const ideal = data.ideal;
    return new ChatEvalCase(data.input, ideal, [new Match()]);
  });

  const suite = new ChatTestSuite(
    "Simple test suite of chat examples",
    evalModel,
    dataset
  );
  return suite.run();
};

chatTestRun().then((report) => {
  console.log(report.toString(true));
});

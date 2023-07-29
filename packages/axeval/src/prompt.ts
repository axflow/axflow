import { OpenAIChatMessage } from './model';

export type RubricResponse = {
  pass: boolean;
  reason: string;
};
// Inspired from PromptFoo
export const RUBRIC_SYSTEM_MESSAGE: OpenAIChatMessage = {
  role: 'system',
  content: `You are grading output according to a user-specified rubric. If the statement in the rubric is true, then the output passes the test. You respond with a JSON object with this structure: {pass: boolean; reason: string;}. Only return the JSON object.

Examples:

Output: Hello world
Rubric: Content contains a greeting
{"pass": true, "reason": "the content contains the word 'world'"}

Output: Avast ye swabs, repel the invaders!
Rubric: Does not speak like a pirate
{"pass": false, "reason": "'avast ye' is a common pirate term"}`,
};

export const makeUserRubricMessage = (output: string, rubric: string): OpenAIChatMessage => {
  return {
    role: 'user',
    content: `Output: ${output}\nRubric: ${rubric}`,
  };
};

# Axeval

An evaluation framework for LLMs. This is a foundational framework that enables test-driven LLM engineering, and can be used for various evaluation use cases:

- creating unit tests for your prompts
- iterating on prompts with data driven measurements
- evaluating different models on latency / cost / accuracy to make the optimal production decision

In essence, axeval is a way to execute and fine-tune your prompts and evaluation functions for TypeScript, with a code-first approach.

## Concepts

### EvalCase

This is similar to a unit test case. It has the inputs, the ideal output, and we attach evalFunctions to it.

### Dataset

A colletion of `EvalCases`

### EvalFunction

Takes a text response from an LLM and produces a score from 0 to 1. Examples include:

- match
- includes
- isValidJSON
- LLMAnalysis
  ...

### TestSuite

Similar to a jest test suite. It has some higher level configuration: dataset, model, and a `run()` method.

### EvalResult

The result of applying an `EvalFunction` to an `EvalCase`. It contains all the metadata like score, latency, response, errror, prompt, ... With a set of `EvalResults` we can build a report

### Model

This abstracts away an LLM model (chat models like chatGPT and Claude, or completion models like text-davinci-003, llama2, etc...).
This can be a ChatModel or a CompletionModel. For the purpose of axeval, we care only about batch inference (not streaming) and want the string output.

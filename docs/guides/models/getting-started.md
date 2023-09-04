# Getting Started

@axflow/models is an SDK for building natural language powered applications. This includes basic functionality for invoking the models, but it also includes richer functionality like augmented response streaming, hooks for building client applications, and more.

This guide covers the basics of working with models. For more information, see the following guides:

* [Streaming](/guides/models/streaming.md)
* [Building client applications](/guides/models/building-client-applications.md)
* [Bringing your own models](/guides/models/bring-your-own-models.md)

## Working with models

Axflow provides wrapping for the most popular LLM APIs for convenience. Each API is wrapped using only web standards (e.g., `fetch`) which enables this library to be used in any environment that supports these standards, including edge environments like [Next.js Edge Runtime](https://nextjs.org/docs/pages/api-reference/edge). Similarly, there are no server-side dependencies (e.g., Node stdlib), meaning this library works in client environments like browsers or VSCode extensions.

While Axflow wraps popular LLM APIs with a set of methods, the inputs and outputs to these APIs are defined by the underlying API and not Axflow. Therefore, `OpenAICompletion.run()`, `AnthropicCompletion.run()`, etc. take different arguments and return different responses. Axflow TypeScript types will reflect the expected inputs and outputs, but for more information see the documentation by the underlying model provider.

Axflow does not support every LLM or embedding model, but you can [bring your own](/guides/models/bring-your-own-models.md).

### Running a model

All models define a `run` method that invokes the model and returns its response.

#### `run`

```ts
import { OpenAIEmebdding } from '@axflow/models/openai/embedding';
import { AnthropicCompletion } from '@axflow/models/anthropic/completion';

// Embedding model example
const response = await OpenAIEmebdding.run(
  {
    model: 'text-embedding-ada-002',
    input: "How can I deploy on Vercel?"
  },
  { apiKey: process.env.OPENAI_API_KEY }
);

console.log(response);
// {
//   object: 'list',
//   data: [ { object: 'embedding', index: 0, embedding: [ ... ] } ],
//   model: 'text-embedding-ada-002-v2',
//   usage: { prompt_tokens: 9, total_tokens: 9 }
// }


// Completion model example
const response = await AnthropicCompletion.run(
  {
    model: 'claude-2',
    prompt: "\n\nHuman: How can I deploy on Vercel?\n\nAssistant:",
    max_tokens_to_sample: 80,
  },
  { apiKey: process.env.ANTHROPIC_API_KEY }
);

console.log(response);
// {
//   completion: ' Here are a few steps to deploy on Vercel:\n\n1. Sign up ...',
//   stop_reason: 'max_tokens',
//   model: 'claude-2.0',
//   stop: null,
//   log_id: '70f8c2a98800729d26a9435c6f5745107ed8e570f29149de5baac2e155b5e7f0'
// }
```

### Streaming a model

For models that support streaming, there are a few streaming methods: `streamBytes`, `stream`, and `streamTokens`. Each of these take the same arguments as the `run` methods unless noted otherwise and returns a promise that resolves to a `ReadableStream`.

#### `streamBytes`

`streamBytes` is a low-level method for streaming the raw response bytes. This is useful if you want to forward the response bytes without the overhead of parsing them into objects.

For example, creating an OpenAI proxy on the edge using Next.js is only a couple lines of code:

```ts
import { OpenAIChat } from '@axflow/models/openai/chat';

export const runtime = 'edge'

export async function POST(request: Request) {
  const chatRequest = await request.json();

  const stream = await OpenAIChat.streamBytes(chatRequest, {
    apiKey: process.env.OPENAI_API_KEY,
  });

  return new Response(stream);
}
```

#### `stream`

`stream` builds upon `streamBytes` by parsing the response bytes into JavaScript objects. For example,

```ts
const stream = await CohereGeneration.stream(
  {
    max_tokens: 80,
    prompt: 'Please explain how LLMs work'
  },
  { apiKey: process.env.COHERE_API_KEY },
);

for await (const chunk of stream) {
  console.log(chunk); // Example chunk: { text: ' They', is_finished: false }
}
```

#### `streamTokens`

`streamTokens` builds upon `stream` and returns a stream consisting only of the tokens. This is useful if all you care about is the user-facing LLM response.

```ts
const stream = await CohereGeneration.streamTokens(
  {
    max_tokens: 80,
    prompt: 'Please explain how LLMs work'
  },
  { apiKey: process.env.COHERE_API_KEY },
);

for await (const chunk of stream) {
  console.log(chunk); // Example chunk: " They"
}
```

### Asynchronous iteration

The streaming methods all return a `ReadableStream`. In recent Node.js versions, `ReadableStream`s implement the [async iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols) which allow these objects to be iterated over using the `for await..of` syntax. However, browsers, older node versions, and the TypeScript type system do not currently support the async iterable protocol for `ReadableStream`s. To get around this limitation, Axflow provides a `StreamToIterable` utility function that takes a `ReadableStream<T>` and returns an `AsyncIterable<T>`.

```ts
import { OpenAIChat } from '@axflow/models/openai/chat';
import { StreamToIterable } from '@axflow/models/shared';

const stream = await OpenAIChat.stream(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Please explain how LLMs work' }]
  },
  { apiKey: process.env.OPENAI_API_KEY },
);

// Use StreamToIterable to convert a stream to an async iterable
for await (const chunk of StreamToIterable(stream)) {
  // Do something with chunk
}
```

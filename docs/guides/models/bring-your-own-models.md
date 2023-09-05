# Bring your own models

Axflow provides first-class support for the most popular LLM and embedding models, e.g., OpenAI, Anthropic, Cohere, etc.
However, you may be working with a model or API not supported by Axflow.
Or, you may want to use a client SDK other than Axflow, for example, the openai package for OpenAI models.

This guide will explain how you can bring your own models or client SDKs to Axflow.

## Streaming with an unsupported model

You can use the streaming utilities, like `StreamingJsonResponse`, and client utilities, like `useChat`, with models that are not supported by Axflow.

`StreamingJsonResponse` takes a `ReadableStream` as its first argument. Therefore, all you need to do to interface with this utility is to get your data into a `ReadableStream` object.

If you're using a client SDK that returns a `ReadableStream`, then there is nothing for you to do! You can simply pass that stream directly to `StreamingJsonResponse`.

If you are working with an object that implements the [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols) protocol, then you will need to first transform this object into a stream. Axflow provides a utility to make this dead simple.

Consider the following example, where `ModelProvider` is some model API not supported directly by Axflow:

```ts
import ModelProvider from "some-model-provider";
import {IterableToStream, StreamingJsonResponse} from '@axflow/models/shared';

const provider = new ModelProvider({
  apiKey: process.env.PROVIDER_API_KEY,
});

// POST /api/chat
export async function POST(request: Request) {
  const { messages } = await request.json();

  // Assuming chatCompletion is an async iterable
  const chatCompletion = await provider.chat.completions.create({
    messages: messages.map(msg => ({ role: 'user', content: msg.content })),
  });

  // Convert the iterable to a stream
  const stream = IterableToStream(chatCompletion);

  return new StreamingJsonResponse(stream);
}
```

Given this example returns a `StreamingJsonResponse`, then we can use the `useChat` hook on the client.

That's all it takes to bring your own model to the rest of the functionality provided by Axflow.

## Opting out of Axflow models

Similar to the above, you can choose not to use the built-in Axflow models, like `OpenAIChat`, and instead use external client libraries.

```ts
import OpenAI from "openai";
import {IterableToStream, StreamingJsonResponse} from '@axflow/models/shared';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/chat
export async function POST(request: Request) {
  const { messages } = await request.json();

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: messages.map(msg => ({ role: 'user', content: msg.content })),
  });

  // Convert the iterable to a stream
  const stream = IterableToStream(chatCompletion);

  return new StreamingJsonResponse(stream);
}
```

# @axflow/models

Zero-dependency, modular SDK for building robust natural language applications.

```
npm i @axflow/models
```

## Features

* Zero-dependency, modular package to consume all the most popular LLMs, embedding models, and more
* Comes with a set of React hooks for easily creating robust completion and chat components
* Built exclusively on modern web standards such as `fetch` and the stream APIs
* First-class streaming support with both low-level byte streams or higher-level JavaScript objects
* Supports Node 18+, Next.js serverless or edge runtime, browsers, ESM, CJS, and more
* Supports a custom `fetch` implementation for request middleware (e.g., custom headers, logging)

## Supported models

- ✅ OpenAI and OpenAI-compatible Chat, Completion, and Embedding models
- ✅ Cohere and Cohere-compatible Generation and Embedding models
- ✅ Anthropic and Anthropic-compatible Completion models
- Google PaLM models (coming soon)
- Azure OpenAI (coming soon)
- Replicate (coming soon)
- HuggingFace (coming soon)

## Guides

See the guides at [docs.axilla.io](/guides).

## Basic Usage

```ts
import {OpenAIChat} from '@axflow/models/openai/chat';
import {CohereGenerate} from '@axflow/models/cohere/generate';
import {StreamToIterable} from '@axflow/models/shared';

const gpt4Stream = OpenAIChat.stream(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'What is the Eiffel tower?' }],
  },
  {
    apiKey: '<openai api key>',
  },
);

const cohereStream = CohereGenerate.stream(
  {
    model: 'command-nightly',
    prompt: 'What is the Eiffel tower?',
  },
  {
    apiKey: '<cohere api key>',
  },
);

// StreamToIterable is optional in recent node versions as
// ReadableStreams already implement the async iterator protocol
for await (const chunk of StreamToIterable(gpt4Stream)) {
  console.log(chunk.choices[0].delta.content);
}

for await (const chunk of StreamToIterable(cohereStream)) {
  console.log(chunk.text);
}
```

For models that support streaming, there is a convenience method for streaming only the string tokens.

```ts
import {OpenAIChat} from '@axflow/models/openai/chat';

const tokenStream = OpenAIChat.streamTokens(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'What is the Eiffel tower?' }],
  },
  {
    apiKey: '<openai api key>',
  },
);

// Example stdout output:
//
// The Eiffel Tower is a renowned wrought-iron landmark located in Paris, France, known globally as a symbol of romance and elegance.
//
for await (const token of tokenStream) {
  process.stdout.write(token);
}

process.stdout.write("\n");
```

## `useChat` hook for dead simple UI integration

We've made building chat and completion UIs trivial. It doesn't get any easier than this 🚀

```ts
///////////////////
// On the server //
///////////////////
import { OpenAIChat } from '@axflow/models/openai/chat';
import { StreamingJsonResponse, type MessageType } from '@axflow/models/shared';

export const runtime = 'edge';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = await OpenAIChat.streamTokens(
    {
      model: 'gpt-4',
      messages: messages.map((msg: MessageType) => ({ role: msg.role, content: msg.content })),
    },
    {
      apiKey: process.env.OPENAI_API_KEY!,
    },
  );

  return new StreamingJsonResponse(stream);
}

///////////////////
// On the client //
///////////////////
import { useChat } from '@axflow/models/react';

function ChatComponent() {
  const {input, messages, onChange, onSubmit} = useChat();

  return (
    <>
      <Messages messages={messages} />
      <Form input={input} onChange={onChange} onSubmit={onSubmit} />
    </>
  );
}
```

## Next.js edge proxy example

Sometimes you just want to create a proxy to the underlying LLM API. In this example, the server intercepts the request on the edge, adds the proper API key, and forwards the byte stream back to the client.

*Note this pattern works exactly the same with our other models that support streaming, like Cohere and Anthropic.*

```ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAIChat } from '@axflow/models/openai/chat';

export const runtime = 'edge'

// POST /api/openai/chat
export async function POST(request: NextRequest) {
  const chatRequest = await request.json();

  // We'll stream the bytes from OpenAI directly to the client
  const stream = await OpenAIChat.streamBytes(chatRequest, {
    apiKey: process.env.OPENAI_API_KEY!,
  });

  return new NextResponse(stream);
}
```

On the client, we can use `OpenAIChat.stream` with a custom `apiUrl` in place of the `apiKey` that points to our Next.js edge route.

*DO NOT expose api keys to your frontend.*

```ts
import { OpenAIChat } from '@axflow/models/openai/chat';
import { StreamToIterable } from '@axflow/models/shared';

const stream = await OpenAIChat.stream(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'What is the Eiffel tower?' }],
  },
  {
    apiUrl: "/api/openai/chat",
  }
);

for await (const chunk of StreamToIterable(stream)) {
  console.log(chunk.choices[0].delta.content);
}
```

## API

### @axflow/models/openai/chat

```ts
import {OpenAIChat} from '@axflow/models/openai/chat';
import type {OpenAIChatTypes} from '@axflow/models/openai/chat';

OpenAIChat.run(/* args */)
OpenAIChat.stream(/* args */)
OpenAIChat.streamBytes(/* args */)
OpenAIChat.streamTokens(/* args */)
```

### @axflow/models/openai/completion

```ts
import {OpenAICompletion} from '@axflow/models/openai/completion';
import type {OpenAICompletionTypes} from '@axflow/models/openai/completion';

OpenAICompletion.run(/* args */)
OpenAICompletion.stream(/* args */)
OpenAICompletion.streamBytes(/* args */)
OpenAICompletion.streamTokens(/* args */)
```

### @axflow/models/openai/embedding

```ts
import {OpenAIEmbedding} from '@axflow/models/openai/embedding';
import type {OpenAIEmbeddingTypes} from '@axflow/models/openai/embedding';

OpenAIEmbedding.run(/* args */)
```

### @axflow/models/cohere/generation

```ts
import {CohereGeneration} from '@axflow/models/cohere/generation';
import type {CohereGenerationTypes} from '@axflow/models/cohere/generation';

CohereGeneration.run(/* args */)
CohereGeneration.stream(/* args */)
CohereGeneration.streamBytes(/* args */)
CohereGeneration.streamTokens(/* args */)
```

### @axflow/models/cohere/embedding

```ts
import {CohereEmbedding} from '@axflow/models/cohere/embedding';
import type {CohereEmbeddingTypes} from '@axflow/models/cohere/embedding';

CohereEmbedding.run(/* args */)
```

### @axflow/models/anthropic/completion

```ts
import {AnthropicCompletion} from '@axflow/models/anthropic/completion';
import type {AnthropicCompletionTypes} from '@axflow/models/anthropic/completion';

AnthropicCompletion.run(/* args */)
AnthropicCompletion.stream(/* args */)
AnthropicCompletion.streamBytes(/* args */)
AnthropicCompletion.streamTokens(/* args */)
```

### @axflow/models/react

```ts
import {useChat} from '@axflow/models/react';
import type {UseChatOptionsType, UseChatResultType} from '@axflow/models/shared';
```

`useChat` is a react hook that makes building chat componets a breeze.

### @axflow/models/shared

```ts
import {StreamToIterable, NdJsonStream, StreamingJsonResponse, HttpError, isHttpError} from '@axflow/models/shared';
import type {NdJsonValueType, JSONValueType, MessageType} from '@axflow/models/shared';
```

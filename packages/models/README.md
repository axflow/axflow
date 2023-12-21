# @axflow/models

Zero-dependency, modular SDK for building robust natural language applications.

```
npm i @axflow/models
```

## Features

- Support for all leading model providers, plus popular open source models like Llama2 or Mistral through Together.ai inference
- First-class streaming support for both low-level byte streams and higher-level JavaScript object streams
- First-class support for streaming arbitrary data in addition to the LLM response
- Comes with a set of utilities and React hooks for easily creating robust client applications
- Built exclusively on modern web standards such as `fetch` and the stream APIs
- Supports Node 18+, Next.js serverless or edge runtime, Express.js, browsers, ESM, CJS, and more
- Supports a custom `fetch` implementation for request middleware (e.g., custom headers, logging)

## Supported models

- ✅ OpenAI and OpenAI-compatible Chat, Completion, and Embedding models
- ✅ Cohere and Cohere-compatible Generation and Embedding models
- ✅ Anthropic and Anthropic-compatible Completion models
- ✅ HuggingFace text generation inference API and Inference Endpoints
- ✅ Ollama.ai models running locally
- ✅ Azure OpenAI
- ✅ Google Gemini
- ✅ TogetherAI (Llama2, Mistral, etc.)

## Documentation

View the [Guides](https://docs.axflow.dev/guides) or the reference:

- [@axflow/models/openai/chat](https://docs.axflow.dev/documentation/models/openai-chat.html)
- [@axflow/models/openai/completion](https://docs.axflow.dev/documentation/models/openai-completion.html)
- [@axflow/models/openai/embedding](https://docs.axflow.dev/documentation/models/openai-embedding.html)
- [@axflow/models/google/generate-content](https://docs.axflow.dev/documentation/models/google-generate-content.html)
- [@axflow/models/azure-openai/chat](https://docs.axflow.dev/documentation/models/azure-openai-chat.html)
- [@axflow/models/anthropic/completion](https://docs.axflow.dev/documentation/models/anthropic-completion.html)
- [@axflow/models/cohere/generation](https://docs.axflow.dev/documentation/models/cohere-generation.html)
- [@axflow/models/cohere/embedding](https://docs.axflow.dev/documentation/models/cohere-embedding.html)
- [@axflow/models/huggingface/text-generation](https://docs.axflow.dev/documentation/models/huggingface-text-generation.html)
- [@axflow/models/ollama/generation](https://docs.axflow.dev/documentation/models/ollama-generation.html)
- [@axflow/models/ollama/embedding](https://docs.axflow.dev/documentation/models/ollama-embedding.html)
- [@axflow/models/togetherai/inference](https://docs.axflow.dev/documentation/models/togetherai-inference.html)
- [@axflow/models/react](https://docs.axflow.dev/documentation/models/react.html)
- [@axflow/models/node](https://docs.axflow.dev/documentation/models/node.html)
- [@axflow/models/shared](https://docs.axflow.dev/documentation/models/shared.html)

## Example Usage

```ts
import { OpenAIChat } from '@axflow/models/openai/chat';
import { CohereGenerate } from '@axflow/models/cohere/generate';
import { StreamToIterable } from '@axflow/models/shared';

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
import { OpenAIChat } from '@axflow/models/openai/chat';

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

process.stdout.write('\n');
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
  const { input, messages, onChange, onSubmit } = useChat();

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

_Note this pattern works exactly the same with our other models that support streaming, like Cohere and Anthropic._

```ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAIChat } from '@axflow/models/openai/chat';

export const runtime = 'edge';

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

_DO NOT expose api keys to your frontend._

```ts
import { OpenAIChat } from '@axflow/models/openai/chat';
import { StreamToIterable } from '@axflow/models/shared';

const stream = await OpenAIChat.stream(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'What is the Eiffel tower?' }],
  },
  {
    apiUrl: '/api/openai/chat',
  },
);

for await (const chunk of StreamToIterable(stream)) {
  console.log(chunk.choices[0].delta.content);
}
```

## Express.js example

Uses express + React hook on frontend.

```ts
///////////////////
// On the server //
///////////////////
const express = require('express');
const { OpenAIChat } = require('@axflow/models/openai/chat');
const { streamJsonResponse } = require('@axflow/models/node');

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  const stream = await OpenAIChat.streamTokens(
    {
      model: 'gpt-3.5-turbo',
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    },
    {
      apiKey: process.env.OPENAI_API_KEY,
    },
  );

  return streamJsonResponse(stream, res);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

///////////////////
// On the client //
///////////////////
import { useChat } from '@axflow/models/react';

function ChatComponent() {
  const { input, messages, onChange, onSubmit } = useChat();

  return (
    <>
      <Messages messages={messages} />
      <Form input={input} onChange={onChange} onSubmit={onSubmit} />
    </>
  );
}
```

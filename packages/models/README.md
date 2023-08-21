# @axflow/models

Zero-dependency module to run, stream, and render results across the most popular LLMs and embedding models.

```
npm i @axflow/models
```

## Features

* Zero-dependency, lightweight package to consume all the most popular models and APIs
* First-class streaming support with both low-level byte streams or higher-level parsed chunks
* Supports Node 17.5.0+, browsers, ESM, CJS, and more environments
* Supports custom `fetch` implementation, allowing for older node environments or request middleware (e.g., logging)

## Supported models

- [X] OpenAI and OpenAI-compatible Chat, Completion, and Embedding models
- [X] Cohere and Cohere-compatible generation and embedding models
- [X] Anthropic and Anthropic-compatible completion models
- [ ] Google PaLM models
- [ ] Azure OpenAI
- [ ] Replicate
- [ ] HuggingFace

## Basic Usage

```ts
import {OpenAIChat} from '@axflow/models/openai/chat';
import {CohereGenerate} from '@axflow/models/cohere/generate';
import {StreamToIterable} from '@axflow/models/utils';

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

In NextJS, it's as simple as:

```ts
import {OpenAIChat} from '@axflow/models/openai/chat';

export async function POST(request: NextRequest) {
  // Byte stream is more efficient here because we do not parse the stream and
  // re-encode it, but rather just pass the bytes directly through to the client.
  const stream = await OpenAIChat.streamBytes(
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'What is the Eiffel tower?' }],
    },
    {
      apiKey: process.env.OPENAI_API_KEY,
    },
  );

  return new Response(stream);
}
```

## API

### @axflow/models/openai/chat

```ts
import {OpenAIChat} from '@axflow/models/openai/chat';

OpenAIChat.run(/* args */)
OpenAIChat.stream(/* args */)
OpenAIChat.streamBytes(/* args */)
```

### @axflow/models/openai/completion

```ts
import {OpenAICompletion} from '@axflow/models/openai/completion';

OpenAICompletion.run(/* args */)
OpenAICompletion.stream(/* args */)
OpenAICompletion.streamBytes(/* args */)
```

### @axflow/models/openai/embedding

```ts
import {OpenAIEmbedding} from '@axflow/models/openai/embedding';

OpenAIEmbedding.run(/* args */)
```

### @axflow/models/cohere/generation

```ts
import {CohereGeneration} from '@axflow/models/cohere/generation';

CohereGeneration.run(/* args */)
CohereGeneration.stream(/* args */)
CohereGeneration.streamBytes(/* args */)
```

### @axflow/models/cohere/embedding

```ts
import {CohereEmbedding} from '@axflow/models/cohere/embedding';

CohereEmbedding.run(/* args */)
```

### @axflow/models/anthropic/completion

```ts
import {AnthropicCompletion} from '@axflow/models/anthropic/completion';

AnthropicCompletion.run(/* args */)
AnthropicCompletion.stream(/* args */)
AnthropicCompletion.streamBytes(/* args */)
```

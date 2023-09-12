# Streaming chat application

We're going to build a chatGPT like chat application with `@axflow/models`, leveraging the `useChat` react hook. Importantly, it will stream results back to the user, to improve the user experience of the typical high latency LLM API calls.

![axchat in action](/assets/axchat.gif)

We'll be using `@axflow/models`, TypeScript, tailwindCSS, React, nextJS, and openAI.

If you want to see the full code of this demo, you can find [here on GitHub](https://github.com/axflow/axchat-demo).

## Setup

First, let's create a new nextJS project with TypeScript & Tailwind:

```
npx create-next-app@latest --typescript --tailwind axchat
✔ Would you like to use ESLint? … *No* / Yes
✔ Would you like to use `src/` directory? … *No* / Yes
✔ Would you like to use App Router? (recommended) … No / *Yes*
✔ Would you like to customize the default import alias? … *No* / Yes
Creating a new Next.js app in /Users/<username>/<dir>/axchat.
```

Second, let's install the models package:

```
npm install @axflow/models
```

Finally, we'll need to add the openAI API key to our `.env.local` file:

```
OPENAI_API_KEY=sk-123...
```

## Scaffolding

Before we make anything work, let's get the scaffolding of our client ready. We'll be using the default `app/page.tsx` as our main route and 2 other components:

- `app/form.tsx` will hold the input box for the user, and the submit button to send each message
- `app/chat-box.tsx` will be exactly what it sounds like.

Let's create the skeleton for each file:

```tsx
// app/form.tsx
export default function Form() {
  return <div>Form</div>;
}
```

```tsx
// app/chat-box.tsx
export default function ChatBox() {
  return <div>Chat box</div>;
}
```

Now, let's clean up all the default nextJS content in `app/page.tsx`, and add our basic scaffold:

```tsx
// app/page.tsx

import ChatBox from './chat-box';
import Form from './form';

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <h1 className="font-extrabold text-2xl">AxChat</h1>
      <ChatBox />
      <Form />
    </main>
  );
}
```

Our scaffolding is ready! Now let's add LLM chat functionality to the application.

## API (server)

Next, we'll want to set up an API route to handle the calls to the openAI API. This API receives a JSON object with a `messages` key which contains an array of `MessageType` objects. This type defined by `@axflow/models` will also be used later on the client.

::: warning
It's important to not expose our secrets to the client, which is why we are using the ENV variable pattern and calling it through our server.
:::

```typescript
// app/api/chat/route.ts
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
    }
  );

  return new StreamingJsonResponse(stream);
}
```

::: info
Note that we use `gpt-4` model here, but we could use any openAI model, e.g. `gpt-3.5-turbo`.
:::

## Client

We'll be using the `useChat` hook from the `@axflow/models` library. We will leverage the following data attributes:

```typescript
const { input, messages, onChange, onSubmit } = useChat();
```

We'll be sending the `messages` to our `ChatBox` component, and the `input, onChange, onSubmit` to our form component.

### ChatBox component

Our chat box will take an array of `MessageType` messages.

```typescript
type MessageType = {
  id: string;
  role: 'user' | 'assistant';
  data?: JSONValueType[];
  content: string;
  created: number;
};
```

Let's modify `ChatBox` to take an array of these messages and display them nicely. We add a little bit of tailwind CSS to make bubbles different depending on who sent them.

```tsx
// app/chat-box.tsx

import type { MessageType } from '@axflow/models/shared';

export default function ChatBox({ messages }: { messages: MessageType[] }) {
  return (
    <div className="w-1/2 h-2/3 flex flex-col gap-2 border border-white rounded p-2 overflow-auto whitespace-pre-line">
      {messages &&
        messages.map((message) => {
          return (
            <div
              key={message.id}
              className={
                message.role === 'user'
                  ? 'self-start text-black bg-white p-2 rounded mr-32'
                  : 'self-end text-black bg-emerald-200 p-2 rounded ml-32'
              }
            >
              {message.content}
            </div>
          );
        })}
    </div>
  );
}
```

### Form component

This component has an input box that the application user can interact with to ask questions to the LLM.
It uses the `onSubmit, onChange, input` values that we get back from the `useChat` hook to communicate with the previously defined API.

Here again, we use tailwind for some minimalistic style changes.

```tsx
// app/form.tsx

import React from 'react';

type FormProps = {
  input: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function Form({ input, onChange, onSubmit }: FormProps) {
  return (
    <div className="w-1/2">
      <form onSubmit={onSubmit}>
        <div className="flex gap-4 w-full justify-between">
          <input
            value={input}
            onChange={onChange}
            className="p-4 bg-black border border-white w-full rounded"
            placeholder="Ask the assistant anything"
          />
          <button
            className="px-6 py-2 bg-emerald-300 text-black rounded hover:bg-emerald-400"
            type="submit"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

## Putting it together

Now that we have the `API`, the `ChatBox` component, and the `Form` component, we simply need to hook them all together on our main page, and we're done!

```tsx
// app/page.tsx

'use client';
import { useChat } from '@axflow/models/react';
import ChatBox from './chat-box';
import Form from './form';

export default function Home() {
  const { input, messages, onChange, onSubmit } = useChat({
    url: '/api/chat',
  });
  return (
    <main className="flex flex-col items-center w-screen h-screen gap-4">
      <h1 className="font-extrabold text-4xl pt-4">AxChat</h1>
      <ChatBox messages={messages} />
      <Form input={input} onChange={onChange} onSubmit={onSubmit} />
    </main>
  );
}
```

## Conclusion

Hopefully, that was easy! With `@axflow/models`, streaming data from different LLM APIs is no longer a battle. By the way, you could replace the openAI model that we used in this guide with any other supported model, or integrate your own against our interface.

Soon, using our `@axflow/models` library will also integrate with other tools to get analytics, as well as send LLM requests and their responses to the axeval package for quality monitoring.

If you want to see the full code of this demo, you can find [here on GitHub](https://github.com/axflow/axchat-demo).

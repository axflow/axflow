# @axflow/models/react

React hooks for building client applications.

```ts
import { useChat } from '@axflow/models/react';
import type { UseChatOptionsType, UseChatResultType } from '@axflow/models/react';
```

## `useChat`

Hook for accessing LLM chat data and state.

```ts
/**
 * A React hook to power LLM chat applications.
 *
 * This hook supports streaming and non-streaming responses. If streaming, the API
 * response must have a content-type header set to `application/x-ndjson; charset=utf-8`.
 * Additionally, it must send its JSON chunks using the following format:
 *
 *     { type: 'data' | 'chunk', value: <any valid JSON value> }
 *
 * When `type` is `chunk`, `value` represents a chunk of the source stream. When `type`
 * is `data`, `value` represents any additional data sent along with the source stream.
 *
 * @param options UseChatOptionsType
 * @returns UseChatResultType
 */
declare function useChat(options?: UseChatOptionsType): UseChatResultType;
```

### Usage

```ts
const { input, setInput, messages, setMessages, loading, error, onChange, onSubmit } = useChat();
```

### Return value

```ts
declare type UseChatResultType = {
  /**
   * Current user's message input.
   */
  input: string;

  /**
   * Manually set the input.
   */
  setInput: (input: string) => void;

  /**
   * The history of messages so far in this chat.
   */
  messages: MessageType[];

  /**
   * Manually set the messages.
   */
  setMessages: (messages: MessageType[]) => void;

  /**
   * If a request is in progress, this will be `true`.
   *
   * For streaming requests, `loading` will be `true` from the time the request is
   * first sent until the stream has closed. For non-streaming requests, it is `true`
   * until a response is received.
   */
  loading: boolean;

  /**
   * If a request fails, this will be populated with the `Error`. This will be reset
   * to `null` upon the next request.
   *
   * See also the `onError` callback option.
   */
  error: Error | null;

  /**
   * A handler to change the user's message input.
   *
   * @param e Either a form field change event or the string representing the changed user input.
   */
  onChange: (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement> | string,
  ) => void;

  /**
   * A handler to trigger submission to the API.
   *
   * @param e Optional `React.FormEvent<HTMLFormElement>` if this value is used with a Form.
   */
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
};
}
```

For a more detailed example, see the guide [Building client applications](/guides/models/building-client-applications.md).

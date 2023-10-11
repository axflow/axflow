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

For a more detailed example, see the guide [Building client applications](/guides/models/building-client-applications.md).

### Options

```ts
/**
 * The options supplied to the useChat hook.
 */
type UseChatOptionsType = {
  /**
   * The API endpoint to call when submitting a new message.
   *
   * Defaults to `/api/chat`.
   */
  url?: string;
  /**
   * Customize the request body sent to the API using this value. It accepts
   * either a function or object.
   *
   * If given a function, the return value of the function will become the body
   * of the request. The function will be passed the new message as its first
   * argument and the history (an array of previous messages) as its second argument.
   *
   * If given an object, the object will be merged into the request body with the
   * full set of messages, i.e., `{...body, messages }`.
   *
   * By default, the request body is `{ messages }`.
   */
  body?: BodyType;
  /**
   * Additional headers to send along with the request to the API.
   */
  headers?: Record<string, string>;
  /**
   * An accessor used to pluck out the message text. The response body or response
   * stream can send back arbitrary values. If the value sent back is not the message
   * text, then this component needs a way to access the message text. This function
   * is given the value from the API as its input and should return the message text
   * as its output.
   *
   * By default, it assumes the value from the API is the message text itself.
   */
  accessor?: (value: any) => string;
  /**
   * Initial message input. Defaults to empty string.
   */
  initialInput?: string;
  /**
   * Initial message history. Defaults to an empty list.
   */
  initialMessages?: MessageType[];
  /**
   * Callback to handle errors should they arise.
   *
   * Defaults to `console.error`.
   */
  onError?: (error: Error) => void;
  /**
   * Callback that is invoked when the list of messages change.
   *
   * Specifically, it is invoked when:
   *
   *     1. `onSubmit` is invoked and a new user message is added.
   *     2. A new message is received from the server. If streaming, this will
   *        be called each time the message is updated from a streaming event.
   *     3. Any time a client of the hook calls `setMessages`
   */
  onMessagesChange?: (updatedMessages: MessageType[]) => void;
  /**
   * Callback that is invoked when a new message is appended to the list of messages.
   *
   * NOTE: For messages received from the server, this will only be invoked ONE time, when
   * the message is complete. That means, for streaming responses, this will not be invoked
   * until the stream has finished and the message is complete. If you want to get notified
   * for each update, the `onMessagesChange` callback fires every time the list of messages
   * changes, which includes message updates from streaming responses.
   */
  onNewMessage?: (message: MessageType) => void;
};
```

### Return value

```ts
/**
 * The result of invoking the useChat hook.
 */
type UseChatResultType = {
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
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement> | string
  ) => void;
  /**
   * A handler to trigger submission to the API.
   *
   * @param e Optional `React.FormEvent<HTMLFormElement>` if this value is used with a Form.
   */
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  /**
   * Sends a request to the server with the current list of messages for a new assistant response.
   *
   * Note:
   *
   *     * If there are no user messages in the list, this function will throw an error.
   *     * If there are assistant messages more recent than the last user message, they will
   *       be removed from the list of messages before sending a request to the server.
   */
  reload: () => void;
};
```

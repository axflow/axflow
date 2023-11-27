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
interface AccessorType<T = any> {
  (value: T): string | null | undefined;
}

interface FunctionCallAccessorType<T = any> {
  (value: T):
    | {
        name?: string;
        arguments?: string;
      }
    | null
    | undefined;
}

interface ToolCallsAccessorType<T = any> {
  (value: T):
    | {
        index?: number;
        id?: string;
        type?: 'function';
        function?: { name?: string; arguments: string };
      }
    | null
    | undefined;
}

type BodyType =
  | Record<string, JSONValueType>
  | ((message: MessageType, history: MessageType[]) => JSONValueType);

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
   * A function to create unique ids assigned to each message.
   *
   * Defaults to UUID v4 via `crypto.randomUUID`.
   */
  createMessageId?: () => string;
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
   * For example, if this hook is used to stream an OpenAI-compatible API response,
   * the following option can be defined to interpret the response content:
   *
   *     import { useChat } from '@axflow/models/react';
   *     import type { OpenAIChatTypes } from '@axflow/models/openai/chat';
   *
   *     const { ... } = useChat({
   *       accessor: (value: OpenAIChatTypes.Chunk) => {
   *         return value.choices[0].delta.content;
   *       }
   *     });
   *
   * By default, it assumes the value from the API is the message text itself.
   */
  accessor?: AccessorType;
  /**
   * An accessor used to pluck out a function call for LLMs that support it. This
   * feature was built to support OpenAI functions, but it can be used for any model
   * that supports a concept of functions.
   *
   * This is used to return the function call object which will then be populated
   * on the assistant message's `functionCall` property. A function call object
   * consists of a `name` property (the function name) and an `arguments` property
   * (the function arguments), both of which are strings. The `arguments` property
   * is encoded as JSON.
   *
   * For example, if this hook is used to stream an OpenAI-compatible API response
   * using functions, the following options can be defined to interpret the response:
   *
   *     import { useChat } from '@axflow/models/react';
   *     import type { OpenAIChatTypes } from '@axflow/models/openai/chat';
   *
   *     const { ... } = useChat({
   *       accessor: (value: OpenAIChatTypes.Chunk) => {
   *         return value.choices[0].delta.content;
   *       },
   *
   *       functionCallAccessor: (value: OpenAIChatTypes.Chunk) => {
   *         return value.choices[0].delta.function_call;
   *       }
   *     });
   */
  functionCallAccessor?: FunctionCallAccessorType;

  /**
   * An accessor used to pluck out multiple tool calls for LLMs that support it.
   * This is the new nomenclature for openAI's functions, since they now can return
   * multiple in one call.
   *
   * This is used to return the object which will then be populated
   * on the assistant message's `tool_calls` property. A tool_call object
   * consists of a index, id, type (always 'function') and function object
   * with name and parameters, encoded as JSON like for the functionCall above.
   *
   * For example, if this hook is used to stream an OpenAI-compatible API response
   * using openAI tools, the following options can be defined to interpret the response:
   *
   *     import { useChat } from '@axflow/models/react';
   *     import type { OpenAIChatTypes } from '@axflow/models/openai/chat';
   *
   *     const { ... } = useChat({
   *       accessor: (value: OpenAIChatTypes.Chunk) => {
   *         return value.choices[0].delta.content;
   *       },
   *
   *       toolCallsAccessor: (value: OpenAIChatTypes.Chunk) => {
   *         return value.choices[0].delta.tool_calls;
   *       }
   *     });
   */
  toolCallsAccessor?: ToolCallsAccessorType;

  /**
   * Initial message input. Defaults to empty string.
   */
  initialInput?: string;
  /**
   * Initial message history. Defaults to an empty list.
   */
  initialMessages?: MessageType[];
  /**
   * Initial set of available functions for the user's next message.
   *
   * This is primarily intended for OpenAI's functions feature.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/create
   */
  initialFunctions?: FunctionType[];
  /**
   * Callback to handle errors should they arise.
   *
   * Defaults to `console.error`.
   */

  /**
   * Initial seet of available tools, which replaced functions, for the user's
   * next message.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/create
   *
   */
  initialTools?: ToolType[];

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
   * List of available functions to send along with the next user message.
   *
   * This is primarily intended for OpenAI's functions feature.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/create
   */
  functions: FunctionType[];
  /**
   * Update list of functions for the next user message.
   *
   * This is primarily intended for OpenAI's functions feature.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/create
   */
  setFunctions: (functions: FunctionType[]) => void;
  /**
   * If a request is in progress, this will be `true`.
   *
   * For streaming requests, `loading` will be `true` from the time the request is
   * first sent until the stream has closed. For non-streaming requests, it is `true`
   * until a response is received.
   */

  /**
   * Update list of tools for the next user message.
   *
   * This is primarily intended for OpenAI's tools feature.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/create
   */
  setTools: (tools: ToolType[]) => void;

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
   *     * If there are no `user` or `system` messages in the list, this function will throw an error.
   *     * If there are assistant messages more recent than the last `user` or `system` message, they will
   *       be removed from the list of messages before sending a request to the server.
   */
  reload: () => void;
};
```

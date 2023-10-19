import { useRef, useCallback, useState, type MutableRefObject } from 'react';
import { POST, HttpError, StreamToIterable, NdJsonStream } from '@axflow/models/shared';
import type { FunctionType, MessageType, JSONValueType } from '@axflow/models/shared';

interface AccessorType<T = any> {
  (value: T): string | null | undefined;
}

interface FunctionCallAccessorType<T = any> {
  (value: T): { name?: string; arguments?: string } | null | undefined;
}

type BodyType =
  | Record<string, JSONValueType>
  | ((message: MessageType, history: MessageType[]) => JSONValueType);

function uuid() {
  return crypto.randomUUID();
}

async function handleStreamingResponse(
  response: Response,
  messagesRef: MutableRefObject<MessageType[]>,
  setMessages: (messages: MessageType[]) => void,
  accessor: AccessorType,
  functionCallAccessor: FunctionCallAccessorType,
  onNewMessage: (message: MessageType) => void,
) {
  const responseBody = response.body;

  // This should never happen if we're here.
  if (responseBody === null) {
    throw new HttpError(
      'Expected response.body to be a stream but response.body is null',
      response,
    );
  }

  let id: string | null = null;

  for await (const chunk of StreamToIterable(NdJsonStream.decode(responseBody))) {
    let messages = messagesRef.current;

    if (chunk.type !== 'chunk') {
      if (!id) {
        id = uuid();
        messages = messages.concat({
          id: id,
          role: 'assistant',
          data: [chunk.value],
          content: '',
          created: Date.now(),
        });
      } else {
        messages = messages.map((msg) => {
          return msg.id !== id ? msg : { ...msg, data: (msg.data || []).concat(chunk.value) };
        });
      }
    } else {
      const chunkContent = accessor(chunk.value);
      const chunkFunctionCall = functionCallAccessor(chunk.value);

      if (!id) {
        id = uuid();

        const message: MessageType = {
          id: id,
          role: 'assistant',
          content: chunkContent ?? '',
          created: Date.now(),
        };

        if (chunkFunctionCall) {
          message.functionCall = {
            name: chunkFunctionCall.name ?? '',
            arguments: chunkFunctionCall.arguments ?? '',
          };
        }

        messages = messages.concat(message);
      } else {
        messages = messages.map((msg) => {
          if (msg.id !== id) {
            return msg;
          }

          const content = msg.content + (chunkContent ?? '');

          if (!chunkFunctionCall) {
            return { ...msg, content };
          }

          const name = msg.functionCall!.name + (chunkFunctionCall.name ?? '');
          const args = msg.functionCall!.arguments + (chunkFunctionCall.arguments ?? '');

          return { ...msg, content: content, functionCall: { name, arguments: args } };
        });
      }
    }

    setMessages(messages);
  }

  const newMessage = messagesRef.current.find((msg) => msg.id === id)!;
  onNewMessage(newMessage);
}

async function handleJsonResponse(
  response: Response,
  messagesRef: MutableRefObject<MessageType[]>,
  setMessages: (messages: MessageType[]) => void,
  accessor: AccessorType,
  functionCallAccessor: FunctionCallAccessorType,
  onNewMessage: (message: MessageType) => void,
) {
  const responseBody = await response.json();
  const content = accessor(responseBody);
  const functionCall = functionCallAccessor(responseBody);
  const newMessage: MessageType = {
    id: uuid(),
    role: 'assistant',
    content: content ?? '',
    created: Date.now(),
  };
  if (functionCall) {
    newMessage.functionCall = {
      name: functionCall.name ?? '',
      arguments: functionCall.arguments ?? '',
    };
  }
  const messages = messagesRef.current.concat(newMessage);
  setMessages(messages);
  onNewMessage(newMessage);
}

async function request(
  prepare: () => JSONValueType,
  messagesRef: MutableRefObject<MessageType[]>,
  setMessages: (messages: MessageType[]) => void,
  url: string,
  headers: Record<string, string>,
  accessor: AccessorType,
  functionCallAccessor: FunctionCallAccessorType,
  loadingRef: MutableRefObject<boolean>,
  setLoading: (loading: boolean) => void,
  setError: (error: Error | null) => void,
  onError: (error: Error) => void,
  onNewMessage: (message: MessageType) => void,
  onSuccess: () => void,
) {
  // Ensure we guard against accidental duplicate calls
  if (loadingRef.current) {
    return;
  }

  // Ensure we are now in a loading state
  setLoading(true);

  // Clear any previous error state
  setError(null);

  const requestBody = prepare();

  let response: Response;

  try {
    response = await POST(url, {
      headers: { ...headers, 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(requestBody),
    });

    const contentType = response.headers.get('content-type') || '';
    const isStreaming = contentType.toLowerCase() === 'application/x-ndjson; charset=utf-8';
    const handler = isStreaming ? handleStreamingResponse : handleJsonResponse;

    // Must `await` here in order to `catch` potential errors
    await handler(response, messagesRef, setMessages, accessor, functionCallAccessor, onNewMessage);

    onSuccess();
  } catch (error) {
    setError(error as Error);
    onError(error as Error);
  } finally {
    setLoading(false);
  }
}

async function stableAppend(
  message: MessageType,
  messagesRef: MutableRefObject<MessageType[]>,
  setMessages: (messages: MessageType[]) => void,
  url: string,
  headers: Record<string, string>,
  body: BodyType,
  accessor: AccessorType,
  functionCallAccessor: FunctionCallAccessorType,
  loadingRef: MutableRefObject<boolean>,
  setLoading: (loading: boolean) => void,
  setError: (error: Error | null) => void,
  onError: (error: Error) => void,
  onNewMessage: (message: MessageType) => void,
  setFunctions: (functions: FunctionType[]) => void,
) {
  // When appending a new message, prepare will do three things:
  //
  //     1. Construct the request body for the subsequent request to the server.
  //     2. Update the message state with the new message that is being appended.
  //     3. Invoked the `onNewMessage` callback with the new message being appended.
  //
  function prepare() {
    const history = messagesRef.current;

    // Construct the request body, which is dependent
    // on the options provided to the hook.
    const requestBody =
      typeof body === 'function'
        ? body(message, history)
        : { ...body, messages: history.concat(message) };

    // We're appending a new user message here. It hasn't
    // been added to the state yet, so we add it now.
    setMessages(history.concat(message));

    // Now that we are appending a new message and just added it
    // to the state, we want to invoke the new message callback.
    onNewMessage(message);

    return requestBody;
  }

  // Now perform the request to the server.
  return request(
    prepare,
    messagesRef,
    setMessages,
    url,
    headers,
    accessor,
    functionCallAccessor,
    loadingRef,
    setLoading,
    setError,
    onError,
    onNewMessage,
    () => setFunctions([]), // Clear functions after each request (similar to clearing user input)
  );
}

async function stableReload(
  messagesRef: MutableRefObject<MessageType[]>,
  setMessages: (messages: MessageType[]) => void,
  url: string,
  headers: Record<string, string>,
  body: BodyType,
  accessor: AccessorType,
  functionCallAccessor: FunctionCallAccessorType,
  loadingRef: MutableRefObject<boolean>,
  setLoading: (loading: boolean) => void,
  setError: (error: Error | null) => void,
  onError: (error: Error) => void,
  onNewMessage: (message: MessageType) => void,
) {
  // When reloading existing messages, prepare will do four things:
  //
  //     1. Find the last message from the user in the list of messages. This message and any previous history will be sent as the request to the server.
  //     2. Remove any assistant messages that are more recent than the last user message.
  //     3. Update the messages state if any messages were removed from the existing state (i.e., assistant message).
  //     4. Construct the request body for the subsequent request to the server.
  //
  function prepare() {
    const messages = messagesRef.current;
    const history: MessageType[] = [];

    let lastUserMessage: MessageType | null = null;

    for (let i = messages.length - 1; i >= 0; i--) {
      if (lastUserMessage === null && messages[i].role === 'user') {
        lastUserMessage = messages[i];
      } else if (lastUserMessage !== null) {
        history.unshift(messages[i]);
      }
    }

    if (lastUserMessage === null) {
      throw new Error('Cannot reload empty conversation');
    }

    // Construct the request body, which is dependent
    // on the options provided to the hook.
    const requestBody =
      typeof body === 'function'
        ? body(lastUserMessage, history)
        : { ...body, messages: history.concat(lastUserMessage) };

    // If we removed messages from the existing messages state above,
    // then let's update the internal messages state to reflect the changes.
    if (messages[messages.length - 1].id !== lastUserMessage.id) {
      setMessages(history.concat(lastUserMessage));
    }

    return requestBody;
  }

  // Now perform the request to the server.
  return request(
    prepare,
    messagesRef,
    setMessages,
    url,
    headers,
    accessor,
    functionCallAccessor,
    loadingRef,
    setLoading,
    setError,
    onError,
    onNewMessage,
    () => {},
  );
}

const DEFAULT_URL = '/api/chat';
const DEFAULT_ACCESSOR = (value: string) => {
  return typeof value === 'string' ? value : undefined;
};
const DEFAULT_FUNCTION_CALL_ACCESSOR = (_value: any) => {
  return undefined;
};
const DEFAULT_BODY = (message: MessageType, history: MessageType[]) => ({
  messages: [...history, message],
});
const DEFAULT_HEADERS = {};
const DEFAULT_ON_ERROR = (error: Error) => {
  console.error(error);
};
const DEFAULT_ON_MESSAGES_CHANGE = (_messages: MessageType[]) => {
  // no-op
};
const DEFAULT_ON_NEW_MESSAGE = (_message: MessageType) => {
  // no-op
};

/**
 * The options supplied to the useChat hook.
 */
export type UseChatOptionsType = {
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

/**
 * The result of invoking the useChat hook.
 */
export type UseChatResultType = {
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
export function useChat(options?: UseChatOptionsType): UseChatResultType {
  options ??= {};

  // Input state
  const initialInput = options.initialInput ?? '';
  const [input, setInput] = useState<string>(initialInput);

  // Message state
  const initialMessages = options.initialMessages ?? [];
  const [messages, _setMessages] = useState<MessageType[]>(initialMessages);
  const messagesRef = useRef<MessageType[]>(initialMessages);

  // Functions state
  const initialFunctions = options.initialFunctions ?? [];
  const [functions, setFunctions] = useState<FunctionType[]>(initialFunctions);

  // Loading state
  const [loading, _setLoading] = useState<boolean>(false);
  const loadingRef = useRef(false);

  // Error state
  const [error, setError] = useState<Error | null>(null);

  const url = options.url ?? DEFAULT_URL;
  const accessor = options.accessor ?? DEFAULT_ACCESSOR;
  const functionCallAccessor = options.functionCallAccessor ?? DEFAULT_FUNCTION_CALL_ACCESSOR;
  const body = options.body ?? DEFAULT_BODY;
  const headers = options.headers ?? DEFAULT_HEADERS;
  const onError = options.onError ?? DEFAULT_ON_ERROR;
  const onMessagesChange = options.onMessagesChange ?? DEFAULT_ON_MESSAGES_CHANGE;
  const onNewMessage = options.onNewMessage ?? DEFAULT_ON_NEW_MESSAGE;

  // Given this calls `onMessagesChange`, be mindful of how this is used internally.
  const setMessages = useCallback(
    (messages: MessageType[]) => {
      _setMessages(messages);
      messagesRef.current = messages;
      onMessagesChange(messages);
    },
    [messagesRef, _setMessages, onMessagesChange],
  );

  const setLoading = useCallback(
    (loading: boolean) => {
      _setLoading(loading);
      loadingRef.current = loading;
    },
    [loadingRef, _setLoading],
  );

  function onChange(
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement> | string,
  ) {
    if (typeof e === 'string') {
      setInput(e);
    } else {
      setInput(e.target.value);
    }
  }

  function onSubmit(e?: React.FormEvent<HTMLFormElement>) {
    if (e) {
      e.preventDefault();
    }

    const newMessage: MessageType = {
      id: uuid(),
      role: 'user',
      content: input,
      created: Date.now(),
    };

    if (functions.length > 0) {
      newMessage.functions = functions;
    }

    stableAppend(
      newMessage,
      messagesRef,
      setMessages,
      url,
      headers,
      body,
      accessor,
      functionCallAccessor,
      loadingRef,
      setLoading,
      setError,
      onError,
      onNewMessage,
      setFunctions,
    );

    setInput('');
  }

  function reload() {
    stableReload(
      messagesRef,
      setMessages,
      url,
      headers,
      body,
      accessor,
      functionCallAccessor,
      loadingRef,
      setLoading,
      setError,
      onError,
      onNewMessage,
    );
  }

  return {
    input,
    setInput,
    messages,
    setMessages,
    functions,
    setFunctions,
    loading,
    error,
    onChange,
    onSubmit,
    reload,
  };
}

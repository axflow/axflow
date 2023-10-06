import { useRef, useCallback, useState, type MutableRefObject } from 'react';
import { POST, HttpError, StreamToIterable, NdJsonStream } from '@axflow/models/shared';
import type { MessageType, JSONValueType } from '@axflow/models/shared';

interface AccessorType<T = any> {
  (value: T): string;
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

      if (!id) {
        id = uuid();
        messages = messages.concat({
          id: id,
          role: 'assistant',
          content: chunkContent,
          created: Date.now(),
        });
      } else {
        messages = messages.map((msg) => {
          return msg.id !== id ? msg : { ...msg, content: msg.content + chunkContent };
        });
      }
    }

    setMessages(messages);
  }
}

async function handleJsonResponse(
  response: Response,
  messagesRef: MutableRefObject<MessageType[]>,
  setMessages: (messages: MessageType[]) => void,
  accessor: AccessorType,
) {
  const responseBody = await response.json();
  const content = accessor(responseBody);
  const messages = messagesRef.current.concat({
    id: uuid(),
    role: 'assistant',
    content: content,
    created: Date.now(),
  });
  setMessages(messages);
}

async function stableAppend(
  message: MessageType,
  messagesRef: MutableRefObject<MessageType[]>,
  setMessages: (messages: MessageType[]) => void,
  url: string,
  headers: Record<string, string>,
  body: BodyType,
  accessor: AccessorType,
  loadingRef: MutableRefObject<boolean>,
  setLoading: (loading: boolean) => void,
  setError: (error: Error | null) => void,
  onError: (error: Error) => void,
) {
  // Ensure we guard against accidental duplicate calls
  if (loadingRef.current) {
    return;
  }

  // Ensure we are now in a loading state
  setLoading(true);

  // Clear any previous error state
  setError(null);

  const history = messagesRef.current;
  const requestBody =
    typeof body === 'function'
      ? body(message, history)
      : { ...body, messages: history.concat(message) };

  setMessages(messagesRef.current.concat(message));

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
    await handler(response, messagesRef, setMessages, accessor);
  } catch (error) {
    setError(error as Error);
    onError(error as Error);
  } finally {
    setLoading(false);
  }
}

const DEFAULT_URL = '/api/chat';
const DEFAULT_ACCESSOR = (value: string) => value;
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

  // Loading state
  const [loading, _setLoading] = useState<boolean>(false);
  const loadingRef = useRef(false);

  // Error state
  const [error, setError] = useState<Error | null>(null);

  const url = options.url ?? DEFAULT_URL;
  const accessor = options.accessor ?? DEFAULT_ACCESSOR;
  const body = options.body ?? DEFAULT_BODY;
  const headers = options.headers ?? DEFAULT_HEADERS;
  const onError = options.onError ?? DEFAULT_ON_ERROR;
  const onMessagesChange = options.onMessagesChange ?? DEFAULT_ON_MESSAGES_CHANGE;

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

  function append(message: MessageType) {
    stableAppend(
      message,
      messagesRef,
      setMessages,
      url,
      headers,
      body,
      accessor,
      loadingRef,
      setLoading,
      setError,
      onError,
    );
  }

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

    append({
      id: uuid(),
      role: 'user',
      content: input,
      created: Date.now(),
    });

    setInput('');
  }

  return { input, setInput, messages, setMessages, loading, error, onChange, onSubmit };
}

import { useRef, useCallback, useState, type MutableRefObject } from 'react';

import { POST, StreamToIterable, NdJsonStream } from '@axflow/models/shared';
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

async function stableAppend(
  message: MessageType,
  messagesRef: MutableRefObject<MessageType[]>,
  setMessages: (messages: MessageType[]) => void,
  url: string,
  headers: Record<string, string>,
  body: BodyType,
  accessor: AccessorType,
) {
  const history = messagesRef.current;
  const requestBody =
    typeof body === 'function' ? body(message, history) : { ...body, message, history };

  setMessages(messagesRef.current.concat(message));

  const response = await POST(url, {
    headers: headers,
    body: JSON.stringify(requestBody),
  });

  const contentType = response.headers.get('content-type') || '';
  const isStreaming = contentType.toLowerCase() === 'application/x-ndjson; charset=utf-8';

  if (isStreaming) {
    const responseBody = response.body;

    if (!responseBody) {
      throw new Error('Http response does not appear to be a stream');
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
  } else {
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
}

const DEFAULT_URL = '/api/chat';
const DEFAULT_ACCESSOR = (value: string) => value;
const DEFAULT_BODY = (message: MessageType, history: MessageType[]) => ({ message, history });
const DEFAULT_HEADERS = {};

export type UseChatOptionsType = {
  url?: string;
  body?: BodyType;
  headers?: Record<string, string>;
  accessor?: AccessorType;
};

export function useChat(options?: UseChatOptionsType) {
  const [input, setInput] = useState<string>('');
  const [messages, _setMessages] = useState<MessageType[]>([]);

  const messagesRef = useRef<MessageType[]>([]);

  const setMessages = useCallback(
    (messages: MessageType[]) => {
      _setMessages(messages);
      messagesRef.current = messages;
    },
    [messagesRef, _setMessages],
  );

  options = options || {};

  const url = options.url || DEFAULT_URL;
  const accessor = options.accessor || DEFAULT_ACCESSOR;
  const body = options.body || DEFAULT_BODY;
  const headers = options.headers || DEFAULT_HEADERS;

  function append(message: MessageType) {
    stableAppend(message, messagesRef, setMessages, url, headers, body, accessor);
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

  return { input, onChange, onSubmit, messages: messages };
}

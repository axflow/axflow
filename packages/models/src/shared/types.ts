export type JSONValueType =
  | null
  | string
  | number
  | boolean
  | { [x: string]: JSONValueType }
  | Array<JSONValueType>;

export type FunctionType = { name: string; description?: string; parameters: JSONValueType };

export type MessageType = {
  /**
   * Can be any unique string.
   *
   * For example, the `useChat` hook uses UUIDs because of their native availability in both Node and browsers.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
   */
  id: string;

  /**
   * Specifies who this message is from.
   */
  role: 'user' | 'assistant' | 'system';

  /**
   * The content of the message. If the message was a function call from the assistant,
   * then this field will be an empty string and the `functionCall` field will be populated.
   */
  content: string;

  /**
   * The time this message was created, expressed as milliseconds since Epoch.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
   */
  created: number;

  /**
   * Any additional data to associate with the message.
   */
  data?: JSONValueType[];

  /**
   * If using OpenAI functions, the functions available to the assistant can be defined here.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/create
   */
  functions?: FunctionType[];

  /**
   * If using OpenAI functions and the assistant responds with a function call,
   * this field will be populated with the function invocation information.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/object
   */
  functionCall?: { name: string; arguments: string };
};

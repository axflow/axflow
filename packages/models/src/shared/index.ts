/**
 * Creates a new, random UUID.
 *
 * @returns UUID
 */
export function uuid() {
  return crypto.randomUUID();
}

export type JSONValueType =
  | null
  | string
  | number
  | boolean
  | { [x: string]: JSONValueType }
  | Array<JSONValueType>;

export type MessageType = {
  id: string;
  role: 'user' | 'assistant';
  data?: JSONValueType[];
  content: string;
  created: number;
};

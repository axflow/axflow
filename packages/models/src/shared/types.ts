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

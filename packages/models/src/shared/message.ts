import type { MessageType } from './types';
import { randomUUID } from 'crypto';

export const createMessage = (message: Partial<MessageType>): MessageType => {
  const defaults = {
    id: randomUUID(),
    role: 'user',
    created: Date.now(),
    content: '',
  };

  return Object.assign(defaults, message);
};

import type { MessageType } from './types';

/*
 * Create a new MessageType object and assign default values.
 * This is particularly useful if the user doesn't want to bother
 * creating an Id and/or a created timestamp, and would like a default
 * behavior for these.
 *
 * @param message - The message object to create, a Partial<MessageType> object.
 * @returns A MessageType object, with all required values assigned.
 */
export const createMessage = (message: Partial<MessageType>): MessageType => {
  const defaults = {
    id: crypto.randomUUID(),
    role: 'user',
    created: Date.now(),
    content: '',
  };

  return Object.assign(defaults, message);
};

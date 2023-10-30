import { createMessage } from '../../src/shared/message';

describe('createMessage', () => {
  it('should create a message with default values', () => {
    const message = createMessage({});
    expect(message).toHaveProperty('id');
    expect(message).toHaveProperty('role', 'user');
    expect(message).toHaveProperty('created');
    expect(message).toHaveProperty('content', '');
    expect(typeof message.id).toBe('string');
    expect(typeof message.created).toBe('number');
  });

  it('should allow overriding the role', () => {
    const role = 'system';
    const message = createMessage({ role });
    expect(message.role).toBe(role);
  });

  it('should allow overriding the content', () => {
    const content = 'Hello, World!';
    const message = createMessage({ content });
    expect(message.content).toBe(content);
  });

  it('should create a unique id for each message', () => {
    const message1 = createMessage({});
    const message2 = createMessage({});
    expect(message1.id).not.toBe(message2.id);
  });

  it('should have a timestamp for created', () => {
    const beforeCreation = Date.now();
    const message = createMessage({});
    const afterCreation = Date.now();
    expect(message.created).toBeGreaterThanOrEqual(beforeCreation);
    expect(message.created).toBeLessThanOrEqual(afterCreation);
  });
});

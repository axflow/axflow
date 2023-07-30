export function wrap<T>(obj: T | T[]): T[] {
  return Array.isArray(obj) ? obj : [obj];
}

export async function time<T>(fn: () => Promise<T>): Promise<{ ms: number; result: T }> {
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  return { ms: end - start, result };
}

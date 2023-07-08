import { randomUUID } from 'node:crypto';

export function zip<T1, T2>(l1: Array<T1>, l2: Array<T2>): Array<[T1, T2]> {
  if (l1.length !== l2.length) {
    throw new Error('Cannot zip with length mismatch');
  }

  return l1.map((item, i) => [item, l2[i]]);
}

export function generateId() {
  return randomUUID();
}

export const progressNoop = {
  start(_total: number, _current: number) {},
  update(_current: number) {},
  stop() {},
};

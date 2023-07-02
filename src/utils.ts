import { encode as b58Encode } from 'bs58';
import { getRandomValues } from 'node:crypto';

export function zip<T1, T2>(l1: Array<T1>, l2: Array<T2>): Array<[T1, T2]> {
  if (l1.length !== l2.length) {
    throw new Error('Cannot zip with length mismatch');
  }

  return l1.map((item, i) => [item, l2[i]]);
}

function getRandomBytes(numBytes: number) {
  return getRandomValues(new Uint8Array(numBytes));
}

export function generateId() {
  return b58Encode(getRandomBytes(16));
}

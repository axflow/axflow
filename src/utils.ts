import { dirname, sep } from 'node:path';
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

export function getPathRelativeToDirectory(path: string, directory: string) {
  // Replace the part of the path leading up to the directory
  path = path.replace(dirname(directory), '');

  // Remove leading slashes
  const leadingSlashesRegExp = new RegExp(`^${sep}+`);
  path = path.replace(leadingSlashesRegExp, '');

  // Normalize path separators using forward slash
  const sepRegExp = new RegExp(sep, 'g');
  path = path.replace(sepRegExp, '/');

  return path;
}

import { randomUUID } from 'node:crypto';

import type { IStringer } from './types';

export function zip<T1, T2>(l1: Array<T1>, l2: Array<T2>): Array<[T1, T2]> {
  if (l1.length !== l2.length) {
    throw new Error('Cannot zip two lists of unequal length');
  }

  return l1.map((item, i) => [item, l2[i]]);
}

export function without<T extends object, K extends keyof T>(
  obj: T,
  ...keys: Array<K>
): Omit<T, K> {
  const result = {} as Omit<T, K>;

  const includeKey = (k: any): k is Exclude<keyof T, K> => !keys.includes(k);

  for (const key of Object.keys(obj)) {
    if (includeKey(key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

export function only<T extends object, K extends keyof T>(obj: T, ...keys: Array<K>): Pick<T, K> {
  const result = {} as Pick<T, K>;

  const includeKey = (k: any): k is K => keys.includes(k);

  for (const key of Object.keys(obj)) {
    if (includeKey(key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

export function wrap<T>(obj: T | T[]): T[] {
  return Array.isArray(obj) ? obj : [obj];
}

export function generateId() {
  return randomUUID();
}

const TEMPLATE_VARIABLE_RE = /\{([a-zA-Z_][a-zA-Z_0-9]*)\}/g;

/**
 * Substitute all template variables with their provided values.
 *
 * A template variable takes the form {identifier} where `identifier`
 * is any valid javascript identifier.
 *
 * Examples:
 *
 *     const result = formatTemplate("Hello, {name}!", {name: "Tobias"});
 *     console.log(result); // Hello, Tobias!
 *
 * @param template A string containing zero or more template variables.
 * @param values An object whose keys correspond to the template variables and values correspond to the variable values.
 * @returns Template with all variables substituted with their values.
 */
export function formatTemplate(template: string, values: Record<string, IStringer>) {
  return template.replaceAll(TEMPLATE_VARIABLE_RE, (_match, variable) => {
    const value = values[variable];
    if (value === undefined) {
      throw new Error(`No value provided for template variable "${variable}"`);
    }
    return String(value);
  });
}

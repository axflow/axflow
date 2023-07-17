import type { Stringer } from './types';

export function zip<T1, T2>(l1: Array<T1>, l2: Array<T2>): Array<[T1, T2]> {
  if (l1.length !== l2.length) {
    throw new Error('Cannot zip two lists of unequal length');
  }

  return l1.map((item, i) => [item, l2[i]]);
}

export function generateId() {
  return crypto.randomUUID();
}

const TEMPLATE_VARIABLE_RE = /\{([a-zA-Z_][a-zA-Z_0-9]*)\}/g;

/**
 * Substitute all template variables with their provided values.
 *
 * A "template variable" is any valid JavaScript variable inside of curly braces.
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
export function formatTemplate(template: string, values: Record<string, Stringer>) {
  return template.replaceAll(TEMPLATE_VARIABLE_RE, (_match, variable) => {
    const value = values[variable];
    if (value === undefined) {
      throw new Error(`No value provided for template variable "${variable}"`);
    }
    return String(value);
  });
}

import { formatTemplate } from './utils';
import type { Prompt as PromptType, Stringer } from './types';

export type PromptOptions = {
  template: string;
};

export class Prompt implements PromptType {
  private template: string;

  constructor(options: PromptOptions) {
    this.template = options.template;
  }

  async render(values: Record<string, Stringer>) {
    return formatTemplate(this.template, values);
  }
}

export type PromptWithContextOptions = {
  template: string;
  contextSeparator?: string;
};

export class PromptWithContext implements PromptType {
  private template: string;
  private contextSeparator: string;

  constructor(options: PromptWithContextOptions) {
    this.template = options.template;
    this.contextSeparator =
      typeof options.contextSeparator === 'string' ? options.contextSeparator : '\n';
  }

  async render(values: { context: string[]; query: string }) {
    const context = values.context.join(this.contextSeparator);
    return formatTemplate(this.template, { context, query: values.query });
  }
}

import { formatTemplate } from '../utils';
import type { Prompt } from '../types';

export type PromptWithContextOptions = {
  template: string;
  contextSeparator?: string;
};

export class PromptWithContext implements Prompt {
  private template: string;
  private contextSeparator: string;

  constructor(options: PromptWithContextOptions) {
    this.template = options.template;
    this.contextSeparator =
      typeof options.contextSeparator === 'string' ? options.contextSeparator : '\n---\n';
  }

  async render(values: { context: string[]; query: string }) {
    const context = values.context.join(this.contextSeparator);
    return formatTemplate(this.template, { context, query: values.query });
  }
}

import { formatTemplate } from './utils';
import type { IPrompt, IStringer } from './types';

export type BasicPromptOptions = {
  template: string;
};

export class BasicPrompt implements IPrompt {
  private template: string;

  constructor(options: BasicPromptOptions) {
    this.template = options.template;
  }

  async render(values: Record<string, IStringer>) {
    return formatTemplate(this.template, values);
  }
}

export type PromptWithContextOptions = {
  template: string;
  contextSeparator?: string;
};

export class PromptWithContext implements IPrompt {
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

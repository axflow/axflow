import { formatTemplate } from './utils';
import type { IPrompt, IStringer } from './types';
import { OpenAIChatCompletionMessageInput } from './models';

export type BasicPromptOptions = {
  template: string;
};

export class BasicPrompt implements IPrompt<string> {
  private template: string;

  constructor(options: BasicPromptOptions) {
    this.template = options.template;
  }

  async render(values: Record<string, IStringer>) {
    return formatTemplate(this.template, values);
  }
}

export class BasicPromptMessage implements IPrompt<OpenAIChatCompletionMessageInput> {
  private template: string;

  constructor(options: BasicPromptOptions) {
    this.template = options.template;
  }

  async render(values: Record<string, IStringer>) {
    const message = formatTemplate(this.template, values);
    return {
      role: 'user' as const,
      content: message,
    };
  }
}

export type PromptWithContextOptions = {
  template: string;
  contextSeparator?: string;
};

export class PromptWithContext implements IPrompt<string> {
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

export type PromptMessageWithContextOptions = {
  template: string;
  contextSeparator?: string;
};

export class PromptMessageWithContext implements IPrompt<OpenAIChatCompletionMessageInput> {
  private template: string;
  private contextSeparator: string;

  constructor(options: PromptMessageWithContextOptions) {
    this.template = options.template;
    this.contextSeparator =
      typeof options.contextSeparator === 'string' ? options.contextSeparator : '\n';
  }

  async render(values: { context: string[]; query: string }) {
    const context = values.context.join(this.contextSeparator);
    const message = formatTemplate(this.template, { context, query: values.query });
    return {
      role: 'user' as const,
      content: message,
    };
  }
}

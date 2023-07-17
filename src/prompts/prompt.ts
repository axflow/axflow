import { formatTemplate } from '../utils';
import type { Prompt as PromptType, Stringer } from '../types';

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

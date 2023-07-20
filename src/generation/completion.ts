import type { IModel, IPrompt } from '../types';

export type CompletionOptions = {
  model: IModel<string, string>;
  prompt: IPrompt<string>;
};

export class Completion {
  private model: IModel<string, string>;
  private prompt: IPrompt<string>;

  constructor(options: CompletionOptions) {
    this.model = options.model;
    this.prompt = options.prompt;
  }

  async run(query: string) {
    const prompt = await this.prompt.render({ query });

    const result = await this.model.run(prompt);

    return result;
  }

  stream(query: string) {
    const self = this;

    return {
      async *[Symbol.asyncIterator]() {
        const prompt = await self.prompt.render({ query });

        const iterable = self.model.stream(prompt);

        for await (const part of iterable) {
          yield part;
        }
      },
    };
  }
}

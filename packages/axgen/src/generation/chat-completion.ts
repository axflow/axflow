import type { IModel, IPrompt } from '../types';
import type {
  OpenAIChatCompletionMessageInput,
  OpenAIChatCompletionNoStreaming,
  OpenAIChatCompletionStreaming,
} from '../models';

export type ChatCompletionOptions = {
  model: IModel<
    OpenAIChatCompletionMessageInput[],
    OpenAIChatCompletionNoStreaming.Response,
    OpenAIChatCompletionStreaming.Response
  >;
  prompt: IPrompt<OpenAIChatCompletionMessageInput>;
};

export class ChatCompletion {
  private model: IModel<
    OpenAIChatCompletionMessageInput[],
    OpenAIChatCompletionNoStreaming.Response,
    OpenAIChatCompletionStreaming.Response
  >;
  private prompt: IPrompt<OpenAIChatCompletionMessageInput>;

  constructor(options: ChatCompletionOptions) {
    this.model = options.model;
    this.prompt = options.prompt;
  }

  async run(query: string, messages: OpenAIChatCompletionMessageInput[] = []) {
    const message = await this.prompt.render({ query });

    const result = await this.model.run(messages.concat(message));

    return result;
  }

  stream(query: string, messages: OpenAIChatCompletionMessageInput[] = []) {
    const self = this;

    return {
      async *[Symbol.asyncIterator]() {
        const message = await self.prompt.render({ query });

        const iterable = self.model.stream(messages.concat(message));

        for await (const part of iterable) {
          yield part;
        }
      },
    };
  }
}

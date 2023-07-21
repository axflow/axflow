import type { IDataEmbedder, IModel, IPrompt, IRetriever, IVectorQueryResult } from '../types';

import type {
  OpenAIChatCompletionMessageInput,
  OpenAIChatCompletionNoStreaming,
  OpenAIChatCompletionStreaming,
} from '../models';

export type RAGChatOptions = {
  model: IModel<
    OpenAIChatCompletionMessageInput[],
    OpenAIChatCompletionNoStreaming.Response,
    OpenAIChatCompletionStreaming.Response
  >;
  prompt: IPrompt<OpenAIChatCompletionMessageInput>;
  retriever: IRetriever;
  embedder: IDataEmbedder;
};

export class RAGChat {
  private retriever: IRetriever;
  private model: IModel<
    OpenAIChatCompletionMessageInput[],
    OpenAIChatCompletionNoStreaming.Response,
    OpenAIChatCompletionStreaming.Response
  >;
  private prompt: IPrompt<OpenAIChatCompletionMessageInput>;
  private embedder: IDataEmbedder;

  constructor(options: RAGChatOptions) {
    this.model = options.model;
    this.prompt = options.prompt;
    this.retriever = options.retriever;
    this.embedder = options.embedder;
  }

  async run(query: string, messages: OpenAIChatCompletionMessageInput[] = []) {
    const embeddings = await this.embedder.embed(query);

    const context = await this.retriever.retrieve(embeddings[0]);

    const message = await this.prompt.render({
      query,
      context: context.map((ctx) => ctx.chunk.text),
    });

    const result = await this.model.run(messages.concat(message));

    return { result, context };
  }

  stream(query: string, messages: OpenAIChatCompletionMessageInput[] = []) {
    const self = this;
    const info: { context?: IVectorQueryResult[] } = {};

    return {
      info: info,
      result: {
        async *[Symbol.asyncIterator]() {
          const embeddings = await self.embedder.embed(query);

          const context = await self.retriever.retrieve(embeddings[0]);

          info.context = context;

          const message = await self.prompt.render({
            query,
            context: context.map((ctx) => ctx.chunk.text),
          });

          const iterable = self.model.stream(messages.concat(message));

          for await (const part of iterable) {
            yield part;
          }
        },
      },
    };
  }
}

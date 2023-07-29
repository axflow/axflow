import type { IDataEmbedder, IModel, IPrompt, IRetriever, IVectorQueryResult } from '../types';

export type RAGOptions = {
  model: IModel<string, string>;
  prompt: IPrompt<string>;
  retriever: IRetriever;
  embedder: IDataEmbedder;
};

export class RAG {
  private retriever: IRetriever;
  private model: IModel<string, string>;
  private prompt: IPrompt<string>;
  private embedder: IDataEmbedder;

  constructor(options: RAGOptions) {
    this.model = options.model;
    this.prompt = options.prompt;
    this.retriever = options.retriever;
    this.embedder = options.embedder;
  }

  async run(query: string) {
    const embeddings = await this.embedder.embed(query);

    const context = await this.retriever.retrieve(embeddings[0]);

    const prompt = await this.prompt.render({
      query,
      context: context.map((ctx) => ctx.chunk.text),
    });

    const result = await this.model.run(prompt);

    return { result, context };
  }

  stream(query: string) {
    const self = this;
    const info: { context?: IVectorQueryResult[] } = {};

    return {
      info: info,
      result: {
        async *[Symbol.asyncIterator]() {
          const embeddings = await self.embedder.embed(query);

          const context = await self.retriever.retrieve(embeddings[0]);

          info.context = context;

          const prompt = await self.prompt.render({
            query,
            context: context.map((ctx) => ctx.chunk.text),
          });

          const iterable = self.model.stream(prompt);

          for await (const part of iterable) {
            yield part;
          }
        },
      },
    };
  }
}

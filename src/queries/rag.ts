import type { DataEmbedderObject, Model, Prompt, Retriever } from '../types';

export type RAGOptions = {
  model: Model;
  prompt: Prompt;
  retriever: Retriever;
  embedder: DataEmbedderObject;
};

export class RAG {
  private retriever: Retriever;
  private model: Model;
  private prompt: Prompt;
  private embedder: DataEmbedderObject;

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

    return result;
  }

  stream(query: string) {
    const self = this;

    return {
      async *[Symbol.asyncIterator]() {
        const embeddings = await self.embedder.embed(query);

        const context = await self.retriever.retrieve(embeddings[0]);

        const prompt = await self.prompt.render({
          query,
          context: context.map((ctx) => ctx.chunk.text),
        });

        const iterable = self.model.stream(prompt);

        for await (const part of iterable) {
          yield part;
        }
      },
    };
  }
}

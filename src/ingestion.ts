import {
  DataEmbedder,
  DataEmbedderObject,
  DataSource,
  DataSplitter,
  DataSplitterObject,
  VectorStore,
} from './types';
import { zip } from './utils';

type LoggerType = { info: (message: string) => void };

const logger = {
  info: (message: string) => console.log(message),
};

export class Ingestion {
  private store: VectorStore;
  private source: DataSource;
  private splitter: DataSplitterObject;
  private embedder: DataEmbedderObject;
  private logger: LoggerType;

  constructor(options: {
    store: VectorStore;
    source: DataSource;
    splitter: DataSplitter;
    embedder: DataEmbedder;
    logger?: LoggerType;
  }) {
    this.store = options.store;
    this.source = options.source;
    this.logger = options.logger || logger;

    this.splitter =
      typeof options.splitter === 'function' ? { split: options.splitter } : options.splitter;

    this.embedder =
      typeof options.embedder === 'function' ? { embed: options.embedder } : options.embedder;
  }

  async run() {
    for await (const document of this.source.iterable()) {
      const chunks = await this.splitter.split(document);

      const embeddings = await this.embedder.embed(chunks.map((doc) => doc.text));

      const chunksWithEmbeddings = zip(chunks, embeddings).map(([chunk, embeddings]) => ({
        ...chunk,
        embeddings,
      }));

      await this.store.add(chunksWithEmbeddings);

      const count = chunks.length;

      this.logger.info(
        `Ingested ${document.url} split into ${count} ${count === 1 ? 'chunk' : 'chunks'}`
      );
    }
  }
}

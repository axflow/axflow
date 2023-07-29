import type { IDataEmbedder, IDataSource, IDataSplitter, IVectorStore } from './types';
import { zip } from './utils';

export interface LoggerType {
  info: (message: string) => void;
}

const defaultLogger = {
  info: (message: string) => console.log(message),
};

export class Ingestion {
  private store: IVectorStore;
  private source: IDataSource;
  private splitter: IDataSplitter;
  private embedder: IDataEmbedder;
  private logger: LoggerType;

  constructor(options: {
    store: IVectorStore;
    source: IDataSource;
    splitter: IDataSplitter;
    embedder: IDataEmbedder;
    logger?: LoggerType;
  }) {
    this.store = options.store;
    this.source = options.source;
    this.logger = options.logger || defaultLogger;
    this.splitter = options.splitter;
    this.embedder = options.embedder;
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

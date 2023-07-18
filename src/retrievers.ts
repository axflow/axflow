import type { IRetriever, VectorStore } from './types';

type RetrievalOptions = {
  store: VectorStore;
  topK: number;
  filterTerm?: string;
};

export class Retriever implements IRetriever {
  private store: VectorStore;
  private options: Omit<RetrievalOptions, 'store'>;

  constructor(options: RetrievalOptions) {
    this.store = options.store;
    this.options = { topK: options.topK, filterTerm: options.filterTerm };
  }

  retrieve(embedding: number[]) {
    return this.store.query(embedding, this.options);
  }
}

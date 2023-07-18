import type { IRetriever, IVectorStore } from './types';

export class Retriever implements IRetriever {
  private store: IVectorStore;
  private options: { topK: number; filterTerm?: string };

  constructor(options: { store: IVectorStore; topK: number; filterTerm?: string }) {
    this.store = options.store;
    this.options = { topK: options.topK, filterTerm: options.filterTerm };
  }

  retrieve(embedding: number[]) {
    return this.store.query(embedding, this.options);
  }
}

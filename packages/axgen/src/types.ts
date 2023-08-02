//////////
// Data //
//////////

export type Document = {
  url: string;
  text: string;
  metadata: Record<string, any>;
};

export type Chunk = {
  id: string;
  url: string;
  text: string;
  metadata: Record<string, any>;
};

export type ChunkWithEmbeddings = Chunk & {
  embeddings: number[];
};

/////////////////////
// Data Operations //
/////////////////////

export interface IDataSource {
  iterable(): AsyncIterable<Document>;
}

export interface IDataSplitter {
  split(node: Document): Promise<Chunk[]>;
}

export interface IDataEmbedder {
  embed(data: string | string[]): Promise<number[][]>;
}

//////////////////
// Vector Store //
//////////////////

export interface IVectorStore {
  add(chunks: ChunkWithEmbeddings[], options?: object): Promise<string[]>;
  delete(ids: string | string[]): Promise<void>;
  query(embedding: number[], options: IVectorQueryOptions): Promise<IVectorQueryResult[]>;
}

export interface IVectorQueryOptions {
  topK: number;
  filterTerm?: string;
}

export interface IVectorQueryResult {
  id: string;
  similarity: number | null;
  chunk: Chunk;
}

/////////////
// Prompts //
/////////////
export interface IPrompt<T> {
  render(values: Record<string, any>): Promise<T>;
}

////////////
// Models //
////////////
export interface IModel<Arg, Result, StreamResult = Result> {
  run(arg: Arg): Promise<Result>;
  stream(arg: Arg): AsyncIterable<StreamResult>;
}

///////////////
// Retriever //
///////////////
export interface IRetriever {
  retrieve(embedding: number[]): Promise<IVectorQueryResult[]>;
}

///////////
// MISC. //
///////////
export interface IStringer {
  toString(): string;
}

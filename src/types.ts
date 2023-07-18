//////////
// Data //
//////////

export type Document = {
  url: string;
  text: string;
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
export interface IPrompt {
  render(values: Record<string, any>): Promise<string>;
}

////////////
// Models //
////////////
export interface IModel {
  run(prompt: string): Promise<string>;
  stream(prompt: string): AsyncIterable<string>;
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

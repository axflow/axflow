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

export interface DataSource {
  iterable(): AsyncIterable<Document>;
}

export interface DataSplitterObject {
  split(node: Document): Promise<Chunk[]>;
}

export interface DataSplitterFunction {
  (node: Document): Promise<Chunk[]>;
}

export type DataSplitter = DataSplitterObject | DataSplitterFunction;

export interface DataEmbedderObject {
  embed(data: string | string[]): Promise<number[][]>;
}

export interface DataEmbedderFunction {
  (data: string | string[]): Promise<number[][]>;
}

export type DataEmbedder = DataEmbedderObject | DataEmbedderFunction;

//////////////////
// Vector Store //
//////////////////

export interface VectorStore {
  add(chunks: ChunkWithEmbeddings[], options?: object): Promise<string[]>;
  query(query: VectorQuery): Promise<VectorQueryResult[]>;
}

export interface VectorQuery {
  topK: number;
  embedding: number[];
  filterTerm?: string;
}

export interface VectorQueryResult {
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
  retrieve(embedding: number[]): Promise<VectorQueryResult[]>;
}

///////////
// MISC. //
///////////
export interface IStringer {
  toString(): string;
}

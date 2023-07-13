//////////
// Data //
//////////

export type SourceNode = {
  url: string;
  text: string;
};

export type Document = {
  id: string;
  url: string;
  text: string;
  metadata: Record<string, any>;
};

export type DocumentWithEmbeddings = Document & {
  embeddings: number[];
};

/////////////////////
// Data Operations //
/////////////////////

export interface DataSource {
  iterable(): AsyncIterable<SourceNode>;
}

export interface DataSplitterObject {
  split(node: SourceNode): Promise<Document[]>;
}

export interface DataSplitterFunction {
  (node: SourceNode): Promise<Document[]>;
}

export type DataSplitter = DataSplitterObject | DataSplitterFunction;

export interface DataEmbedderObject {
  embed(documents: Document[]): Promise<number[][]>;
}

export interface DataEmbedderFunction {
  (documents: Document[]): Promise<number[][]>;
}

export type DataEmbedder = DataEmbedderObject | DataEmbedderFunction;

//////////////////
// Vector Store //
//////////////////

export interface VectorStore {
  name: string;
  add(
    documents: DocumentWithEmbeddings[] | AsyncIterable<DocumentWithEmbeddings[]>,
    options?: object
  ): Promise<string[]>;
  query(query: VectorQuery): Promise<VectorQueryResult[]>;
}

export interface VectorQuery {
  topK: number;
  embedding: number[];
  filterTerm: string;
}

export interface VectorQueryResult {
  id: string;
  similarity: number | null;
  document: Document;
}

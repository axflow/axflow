export interface Document {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

export interface VectorizedDocument extends Document {
  embedding: number[];
}

export interface VectorQuery {
  topK: number;
  embedding: number[];
}

export interface VectorQueryResult {
  id: string;
  similarity: number | null;
  document: Document;
}

export interface VectorStore {
  name: string;
  add(documents: VectorizedDocument[], options?: object): Promise<string[]>;
  query(query: VectorQuery): Promise<VectorQueryResult[]>;
}

import { PineconeClient, utils as pineconeUtils } from '@pinecone-database/pinecone';
import { getEnv } from './config';

const { chunkedUpsert, createIndexIfNotExists } = pineconeUtils;

export type Vector = {
  /**
   * This is the vector's unique id.
   * @type {string}
   * @memberof Vector
   */
  id: string;
  /**
   * This is the vector data included in the request.
   * @type {Array<number>}
   * @memberof Vector
   */
  values: Array<number>;
  /**
   * This is the metadata included in the request.
   * @type {object}
   * @memberof Vector
   */
  metadata?: object;
};

export type QueryRequest = {
  /**
   * The number of results to return for each query.
   * @type {number}
   * @memberof QueryRequest
   */
  topK: number;
  /**
   * The filter to apply. You can use vector metadata to limit your search. See https://www.pinecone.io/docs/metadata-filtering/.
   * @type {object}
   * @memberof QueryRequest
   */
  filter?: object;
  /**
   * Indicates whether vector values are included in the response.
   * @type {boolean}
   * @memberof QueryRequest
   */
  includeValues?: boolean;
  /**
   * Indicates whether metadata is included in the response as well as the ids.
   * @type {boolean}
   * @memberof QueryRequest
   */
  includeMetadata?: boolean;
  /**
   * The query vector. This should be the same length as the dimension of the index being queried. Each `query()` request can contain only one of the parameters `id` or `vector`.
   * @type {Array<number>}
   * @memberof QueryRequest
   */
  vector?: Array<number>;
  /**
   * The unique ID of the vector to be used as a query vector. Each `query()` request can contain only one of the parameters `queries`, `vector`, or  `id`.
   * @type {string}
   * @memberof QueryRequest
   */
  id?: string;
};

export class Pinecone {
  private index: string;
  private dimension: number;
  private namespace: string;
  private apiKey: string;
  private environment: string;
  private client: PineconeClient;

  constructor(options: {
    index: string;
    namespace: string;
    dimension: number;
    apiKey: string;
    environment: string;
  }) {
    this.index = options.index;
    this.dimension = options.dimension;
    this.namespace = options.namespace;
    this.apiKey = options.apiKey;
    this.environment = options.environment;
    this.client = new PineconeClient();
  }

  async init() {
    await this.client.init({
      apiKey: this.apiKey,
      environment: this.environment,
    });
  }

  createIndexIfNotExists() {
    return createIndexIfNotExists(this.client, this.index, this.dimension);
  }

  chunkedUpsert(vectors: Vector[], chunkSize?: number) {
    const index = this.getIndex();
    return chunkedUpsert(index, vectors, this.namespace, chunkSize);
  }

  query(request: QueryRequest) {
    const index = this.getIndex();
    return index.query({
      queryRequest: {
        namespace: this.namespace,
        ...request,
      },
    });
  }

  private getIndex() {
    return this.client.Index(this.index);
  }
}

export default new Pinecone({
  index: getEnv('PINECONE_INDEX'),
  dimension: Number(getEnv('PINECONE_INDEX_DIMENSION')),
  namespace: getEnv('PINECONE_NAMESPACE'),
  apiKey: getEnv('PINECONE_API_KEY'),
  environment: getEnv('PINECONE_ENVIRONMENT'),
});

# Axgen ![Github CI](https://github.com/axilla-io/axgen/workflows/Github%20CI/badge.svg)

Axgen is a framework for connecting your data to large language models.

Ingest, structure, and query your data with ease using the latest vector databases and LLMs.

```bash
npm i axgen
```

### Goals

Axgen's goal is to break down the various concepts of working with LLMs into components with well-defined interfaces.
These interfaces are important as we cannot provide out-of-the-box components for every use case. Some components are
provided (with more coming soon) but the interfaces enable you to extend the framework with your own implementations
to satisfy arbitrary use cases.

Axgen can be thought of as a foundational framework from which you can construct higher-level, declarative workflows.

## Example

This example showcases some of the core concepts of axgen. It 1. ingests local markdown files into the Pinecone vector database
and 2. uses retrieval augemented generation to answer a question about the contents of the data (company sales in this example).

```ts
import {
  Ingestion,
  Pinecone,
  FileSystem,
  MarkdownSplitter,
  OpenAIEmbedder,
  RAG,
  Retriever,
  PromptWithContext,
  OpenAICompletion
} from 'axgen';

const {OPENAI_API_KEY, PINECONE_API_KEY} = process.env;

//////////////////////////////////
// Connect to your vector store //
//////////////////////////////////
const pinecone = new Pinecone({
  index: "mdindex",
  namespace: 'default',
  environment: 'us-west1-gcp-free',
  apiKey: PINECONE_API_KEY,
});

const embedder = new OpenAIEmbedder({apiKey: OPENAI_API_KEY});

/////////////////////////////////
// Ingest local markdown files //
/////////////////////////////////
await new Ingestion({
  store: pinecone,
  source: new FileSystem({path: '../path/to/sales/data', glob: '**/*.md'}),
  splitter: new MarkdownSplitter({chunkSize: 1000}),
  embedder: embedder,
}).run()


///////////////////////////////////////////////////////////
// Use retrieval augmented generation to query your data //
///////////////////////////////////////////////////////////
const template = `Context information is below.
---------------------
{context}
---------------------
Given the context information and not prior knowledge, answer the question: {query}
`;

const rag = new RAG({
  embedder: embedder,
  model: new OpenAICompletion({
    model: 'text-davinci-003',
    max_tokens: 256,
    apiKey: OPENAI_API_KEY,
  }),
  prompt: new PromptWithContext({template}),
  retriever: new Retriever({store: pinecone, topK: 3}),
});

// stream the response
const result = rag.stream(
  'What were our biggest sales in Q4 of this year and who were the customers?'
);

for await (const chunk of result) {
  process.stdout.write(chunk);
}

process.stdout.write('\n');
```

## Overview

The main components of the API are as follows:

* **Vector stores** persist your data embeddings which can later be queried.
* **Data sources** are documents pulled from arbitrary locations, e.g., a PDF from your local file system, documents from Notion, a wikipedia page, etc.
* **Data splitters** split documents from a data source into smaller chunks. The embeddings of those chunks can be persisted in a vector store and later queried by similarity.
* **Data embedders** create embeddings from chunks of text.
* **Data retrievers** query vector stores for chunks of text similar to an input.
* **Prompts and prompt templates** are used to construct the instructions sent to the LLM.
* **Models (LLMs)** perform calls to generate e.g. completions or chat completions.

Additionally, there are two higher-level component types that create workflows out of the above components:

1. **Ingestion** constructs a data ingestion pipeline from a data source, splitter, embedder, and vector store.
2. **Queries** construct data generation pipelines (e.g., chat completion over your custom data) from some input, an embedder, prompts, and a model.

## Development

See the [development docs](docs/development.md).

## License

[MIT](LICENSE.md)

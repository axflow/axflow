# Axgen ![Github CI](https://github.com/axilla-io/axgen/workflows/Github%20CI/badge.svg)

A framework for Retrieval Augmented Generation (RAG).

```bash
npm i axgen
```

## Basic Usage

### Prepare the vector database

Create an index in Pinecone that will store your document embeddings.

```ts
import { Pinecone } from '.';

Pinecone.prepare({
  index: "mdindex",
  environment: 'us-west1-gcp-free',
  dimension: 1536,
  apiKey: process.env.PINECONE_API_KEY,
});
```

### Ingesting data

Here is an example of ingesting local markdown files into the Pinecone vector database.

```ts
import { Ingestion, Pinecone, FileSystem, MarkdownSplitter, OpenAIEmbedder } from 'axgen';

const pinecone = new Pinecone({
  index: "mdindex",
  namespace: 'default',
  environment: 'us-west1-gcp-free',
  apiKey: process.env.PINECONE_API_KEY,
});

const ingestion = new Ingestion({
  store: pinecone,
  source: new FileSystem({ path: '../path/to/directory', glob: '**/*.md' }),
  splitter: new MarkdownSplitter({chunkSize: 1000}),
  embedder: new OpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY }),
});

await ingestion.run();
```

### Querying data

In this example, we use retrieval augemented generation to answer a question about company sales. The information needed to answer the question is assumed to be ingested into a pinecone index. This example will pull relevant documents out of the vector database and forward that to an LLM. The response is streamed back.

```ts
import { RAG, OpenAIEmbedder, Pinecone, Retriever, PromptWithContext, OpenAICompletion } from 'axgen';

const { OPENAI_API_KEY, PINECONE_API_KEY } = process.env;

const pinecone = new Pinecone({
  index: 'mdindex',
  namespace: 'default',
  environment: 'us-west1-gcp-free',
  apiKey: PINECONE_API_KEY,
});

const template = `Context information is below.
---------------------
{context}
---------------------
Given the context information and not prior knowledge, answer the question: {query}
`;

const rag = new RAG({
  model: new OpenAICompletion({
    model: 'text-davinci-003',
    max_tokens: 256,
    apiKey: OPENAI_API_KEY,
  }),
  prompt: new PromptWithContext({ template }),
  embedder: new OpenAIEmbedder({ apiKey: OPENAI_API_KEY }),
  retriever: new Retriever({ store: pinecone, topK: 3 }),
});

const result = rag.stream(
  'What were our biggest sales in Q4 of this year and who were the customers?'
);

for await (const chunk of result) {
  process.stdout.write(chunk);
}

process.stdout.write('\n');
```

## Development

See the [development docs](docs/development.md).

## License

[MIT](LICENSE.md)

# SemanticSearch ![Github CI](https://github.com/axilla-io/semanticsearch/workflows/Github%20CI/badge.svg)

Upload documents to a vector database and query them using semantic search and LLMs.

## Setup

```
> npm i
> cp .env.example .env
```

Then, edit .env with your own configuration.

### Setting up pgvector

If you plan on using postgres + pgvector. You need to have a postgres URL, with the pgvector extension ready to be enabled. If you want to do this locally, first install pgvector with one of these methods:

1.  use homebrew if you installed postgres with homebrew: `brew install pgvector`
2.  follow the [installation instructions in the pgvector README](https://github.com/pgvector/pgvector)

_Note that pgvector is limited to 2k dimensions max today._

## Usage

### Prepare the vector store

```bash
npm run vector_store:prepare -- --store=pinecone
npm run vector_store:prepare -- --store=pg
```

Prepare your vector store for use. The `store` argument is required and must be one of the supported stores.

### Teardown the vector store

```bash
npm run vector_store:teardown -- --store=pinecone
npm run vector_store:teardown -- --store=pg
```

for pinecone: this tears the vector store down, i.e., deletes indexes. The `store` argument is required and must be one of the supported stores.

for pg: this drops the table passed as `$PG_TABLE_NAME` env var.

### Upload records

```bash
npm run vector_store:upload -- --store=pinecone --repo-path=/path/to/repo --glob-path="subfolder/**/*.ext"
```

`repo-path` is the path to the folder containing the documents you want to upload to the vector store. `glob-path` is a glob path pattern to search for the specific documents within `repo-path`. The `store` argument is required and must be one of the supported stores.

For example, to search the Phoenix repository's guides, it would look like:

```
npm run vector_store:upload -- --store=pinecone --repo-path=/path/to/phoenix --glob-path="guides/**/*.md"
```

_Note: Right now, you can only upsert markdown files with index:upsert_

For ingesting data from wikipedia directly:

```
npm run vector_store:upload-wikipedia -- --store=pinecone --term="San Francisco"
```

### Query records

```bash
# example 1 (phoenix)
npm run query -- --store=pinecone --query="How do I do X where X is something in my documents?"

# example 2 (wikipedia)
npm run query -- --store=pinecone --query="When was the San Francisco Police Department founded?"
```

The `store` argument is required and must be one of the supported stores: `['pinecone', 'chroma', 'pg']`

This performs the following actions:

1. Get the embeddings for your query
2. Lookup documents in the vector store that are semantically similar to your query
3. Send a prompt to an OpenAI model containing your original query together with the documents retrieved from the vector store

The model defaults to `text-ada-001`, though can be overridden using the `--model` argument. For example:

```bash
npm run query -- --store=pinecone --query="How do I do X where X is something in my documents?" --model=text-curie-001
```

_Note: Only OpenAI models are supported right now_

You can query the LLM directly using the `--llm-only` flag.

```bash
npm run query -- --store=pinecone --query="How do I do X where X is something in my documents?" --llm-only
```

This allows you to see how the model performs with and without additional context from the vector store.

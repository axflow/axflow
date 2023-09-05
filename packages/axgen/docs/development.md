## Development

## Setup

### PGVector

If you plan on using postgres + pgvector, you need to have a URL to a Postgres instance with pgvector installed. To install locally, you'll need to:

1. Install pgvector, e.g., `brew install pgvector`. *Note: you may need to restart your postgres server after installing this package.*
2. Follow the [installation instructions in the pgvector README](https://github.com/pgvector/pgvector)
3. Create a table with the proper schema (see schema below). Or use our npm `npm run vector_store:prepare -- --store=pgvector` script do so.

This is the schema required by axgen (table name and vector dimension is configurable):

```sql
CREATE TABLE IF NOT EXISTS "<table name>" (
  id TEXT PRIMARY KEY,
  embedding VECTOR(<vector dimension>) NOT NULL,
  text TEXT NOT NULL,
  url TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

### Qdrant

You can follow the quickstart [here](https://qdrant.tech/documentation/quick-start/). For local development, you'll want to pull the docker image and run it. The default UI is findable at http://localhost:6333/dashboard#/console

### Epsilla

You can follow the quickstart [here](https://epsilla-inc.gitbook.io/epsilladb/quick-start). As a prerequisite, you need to pull the Epsilla docker image and run it.

## CLI

There is a CLI local to this repo that is useful for testing locally.

```
> npm i
> cp .env.example .env
```

Then, edit .env with your own configuration.

### Prepare the vector store

```bash
npm run vector_store:prepare -- --store=pinecone
```

Prepare your vector store for use. The `store` argument is required and must be one of the supported stores.

### Teardown the vector store

```bash
npm run vector_store:teardown -- --store=pinecone
```

for pinecone: this tears the vector store down, i.e., deletes indexes. The `store` argument is required and must be one of the supported stores.

### Upload records

```bash
npm run vector_store:upload -- --store=pinecone --source=wikipedia --source-options='{"term": "San Francisco"}'
```

The `vector_store:upload` command will read and upload documents to a given vector store. `--store` and `--source` are required and must be one of the supported stores/sources.

For example, to upload the [Phoenix repository's](https://github.com/phoenixframework/phoenix) guides from a folder on your machine:

```bash
npm run vector_store:upload -- --store=pinecone --source=file_system --source-options='{"path": "../path/to/phoenix", "glob": "guides/**/*.md"}'
```

You can also customize the splitting and embedding operations.

```bash
npm run vector_store:upload -- \
  --store=pinecone \
  --source=file_system --source-options='{"path": "../path/to/phoenix", "glob": "guides/**/*.md"}' \
  --splitter=markdown --splitter-options='{"chunkSize": 1000, "chunkOverlap": 100}' \
  --embedder=openai --embedder-options='{"model": "code-search-ada-code-001"}'
```

The splitter defaults to a basic text splitter and the embedder defaults to OpenAI's `text-embedding-ada-002`.

### Delete records

You can delete records by id.

```
npm run vector_store:delete -- --store pinecone --ids id-1 id-2 id-3
```

### Query records

This will use openai as the example, but the following commands are supported:

* `npm run openai:completion -- <options>`
* `npm run openai:chat-completion -- <options>`
* `npm run vertexai:text -- <options>`
* `npm run vertexai:chat -- <options>`
* `npm run anthropic -- <options>`
* `npm run cohere -- <options>`

These commands all have roughly the same API as the openai examples below.

To ask the openai completion models a question, we can run the following command:

```bash
npm run openai:completion -- --store=pinecone --query="When was the San Francisco Police Department founded?"
```

The `store` argument is required and must be one of the supported stores.

This performs the following actions:

1. Get the embeddings for your query
2. Lookup documents in the vector store that are semantically similar to your query
3. Send a prompt to an OpenAI model containing your original query together with the documents retrieved from the vector store

The model defaults to `text-ada-001`, though can be overridden using the `--model` argument. For example:

```bash
npm run openai:completion -- --store=pinecone --query="How do I do X where X is something in my documents?" --model=text-curie-001
```

_Note: Only OpenAI models are supported right now_

You can query the LLM directly using the `--llm-only` flag.

This allows you to see how the model performs with and without additional context from the vector store.

```bash
npm run openai:completion -- --store=pinecone --query="How do I do X where X is something in my documents?" --llm-only
```

You can filter metadata when querying. Currently, we only support exact match, so to match documents uploaded with the term 'San Francisco' for example:

```
npm run query -- --store=pinecone --query="How do I do X where X is something in my documents?" --filterTerm='San Francisco' --topK=3
```

You can also use chat completions with `npm run openai:chat-completion` using the same options as above.

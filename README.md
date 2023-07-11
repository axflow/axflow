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
```

Prepare your vector store for use. The `store` argument is required and must be one of the supported stores.

### Teardown the vector store

```bash
npm run vector_store:teardown -- --store=pinecone
```

for pinecone: this tears the vector store down, i.e., deletes indexes. The `store` argument is required and must be one of the supported stores.

for pg: this drops the table passed as `$PG_TABLE_NAME` env var.

### Upload records

```bash
npm run vector_store:upload -- --store=pinecone --reader=wikipedia --reader-options='{"term": "San Francisco"}'
```

The `vector_store:upload` command will read and upload documents to a given vector store. `--store` and `--reader` are required and must be one of the supported stores/readers.

For example, to upload the [Phoenix repository's](https://github.com/phoenixframework/phoenix) guides from a folder on your machine:

```bash
npm run vector_store:upload -- --store=pinecone --reader=fs --reader-options='{"path": "../path/to/phoenix", "glob": "guides/**/*.md"}'
```

### Query records

```bash
npm run query -- --store=pinecone --query="When was the San Francisco Police Department founded?"
```

The `store` argument is required and must be one of the supported stores.

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

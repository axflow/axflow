# SemanticSearch ![Github CI](https://github.com/axilla-io/semanticsearch/workflows/Github%20CI/badge.svg)

Upload documents to a vector database and query them using semantic search and LLMs.

## Setup

```
> npm i
> cp .env.example .env
```

Then, edit .env with your own configuration.

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

Tears the vector store down, i.e., deletes indexes. The `store` argument is required and must be one of the supported stores.

### Upload records

```bash
npm run vector_store:upload -- --store=pinecone --repo-path=/path/to/repo --glob-path="subfolder/**/*.ext"
```

`repo-path` is the path to the folder containing the documents you want to upload to the vector store. `glob-path` is a glob path pattern to search for the specific documents within `repo-path`. The `store` argument is required and must be one of the supported stores.

For example, to search the Phoenix repository's guides, it would look like:

```
npm run index:upsert -- --repo-path=/path/to/phoenix --glob-path="guides/**/*.md"
```

_Note: Right now, you can only upsert markdown files with index:upsert_

For ingesting data from wikipedia directly:

```
npm run index:upsert-wikipedia -- --term="San Francisco"
```

### Query records

```bash
npm run query -- --store=pinecone --query="How do I do X where X is something in my documents?"
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

# SemanticSearch

Upload documents to a vector database and query them using semantic search augmented with an LLM.

## Setup

```
npm i
```

The following environment variables are required before running any of the commands below.

```bash
# Pinecone secret API key
PINECONE_API_KEY=
# The environment for your API key. Might look like "us-west1-gcp-free"
PINECONE_ENVIRONMENT=
# Can name your index however you'd like
PINECONE_INDEX=
# The vector dimensions. E.g., 1536 for OpenAI's text-embedding-ada-002 embedding model
PINECONE_INDEX_DIMENSION=
# The namespace for your API key. Often, "default"
PINECONE_NAMESPACE=
# OpenAI secret API key
OPENAI_API_KEY=
```

## Commands

### Create Pinecone index

```bash
npm run index:create
```

### Upsert Pinecone records

```bash
npm run index:upsert -- --repo-path=/path/to/repo --glob-path="subfolder/**/*.ext"
```

`repo-path` is the path to the folder containing the documents you want to upload to Pinecone. `glob-path` is a glob path pattern to search for the specific documents within `repo-path`.

For example, to search the Phoenix repository's guides, it would look like:

```
npm run index:upsert -- --repo-path=/path/to/phoenix --glob-path="guides/**/*.md"
```

*Note: Only markdown files are supported right now*

### Query your records

```bash
npm run query -- --query="How do I do X where X is something in my documents?"
```

This performs the following actions:

1. Get the embeddings for your query
2. Lookup documents in pinecone that are semantically similar to your query
3. Send a prompt to an OpenAI model containing your original query together with the documents retrieved from pinecone

The model defaults to `text-ada-001`, though can be overridden using the `--model` argument. For example:

```bash
npm run query -- --query="How do I do X where X is something in my documents?" --model=text-curie-001
```

*Note: Only OpenAI models are supported right now*

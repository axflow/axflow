# SemanticSearch ![Github CI](https://github.com/axilla-io/semanticsearch/workflows/Github%20CI/badge.svg)

Upload documents to a vector database and query them using semantic search augmented with an LLM.

## Setup

```
> npm i
> cp .env.example .env
```

Then, edit .env with your own configuration.

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

import { OpenAIEmbedder } from './embedders/openai';
import { TextSplitter } from './splitters/text';
import {
  DataEmbedder,
  DataEmbedderObject,
  DataSource,
  DataSplitter,
  DataSplitterObject,
  DocumentWithEmbeddings,
} from './types';
import { zip } from './utils';

export async function* documents(options: {
  source: DataSource;
  splitter?: DataSplitter;
  embedder?: DataEmbedder;
}): AsyncIterable<DocumentWithEmbeddings[]> {
  const source = options.source;

  const splitter: DataSplitterObject =
    typeof options.splitter === 'function'
      ? { split: options.splitter }
      : options.splitter || new TextSplitter();

  const embedder: DataEmbedderObject =
    typeof options.embedder === 'function'
      ? { embed: options.embedder }
      : options.embedder || new OpenAIEmbedder();

  for await (const node of source.iterable()) {
    const documents = await splitter.split(node);
    const embeddings = await embedder.embed(documents.map((doc) => doc.text));

    const documentsWithEmbeddings = zip(documents, embeddings).map(([document, embeddings]) => ({
      ...document,
      embeddings,
    }));

    yield documentsWithEmbeddings;
  }
}

import { OpenAIEmbedder } from './embedders/openai';
import { TextSplitter } from './splitters/text';
import {
  DataEmbedder,
  DataEmbedderObject,
  DataSource,
  DataSplitter,
  DataSplitterObject,
  ChunkWithEmbeddings,
} from './types';
import { zip } from './utils';

export async function* chunks(options: {
  source: DataSource;
  splitter?: DataSplitter;
  embedder?: DataEmbedder;
}): AsyncIterable<ChunkWithEmbeddings[]> {
  const source = options.source;

  const splitter: DataSplitterObject =
    typeof options.splitter === 'function'
      ? { split: options.splitter }
      : options.splitter || new TextSplitter();

  const embedder: DataEmbedderObject =
    typeof options.embedder === 'function'
      ? { embed: options.embedder }
      : options.embedder || new OpenAIEmbedder();

  for await (const document of source.iterable()) {
    const chunks = await splitter.split(document);
    const embeddings = await embedder.embed(chunks.map((doc) => doc.text));

    const chunksWithEmbeddings = zip(chunks, embeddings).map(([chunk, embeddings]) => ({
      ...chunk,
      embeddings,
    }));

    yield chunksWithEmbeddings;
  }
}

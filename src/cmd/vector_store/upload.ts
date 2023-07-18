import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getDataEmbedder, getDataSource, getDataSplitter, getVectorStore } from '../utils';
import { Ingestion } from '../../ingestion';
import { SUPPORTED_DATA_SOURCES } from '../../sources';
import { SUPPORTED_DATA_SPLITTERS } from '../../splitters';
import { SUPPORTED_DATA_EMBEDDERS } from '../../embedders';
import { SUPPORTED_VECTOR_STORES } from '../../vector_stores';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    choices: SUPPORTED_VECTOR_STORES,
    description: 'The vector store',
    demandOption: true,
  })
  .option('source', {
    choices: SUPPORTED_DATA_SOURCES,
    description: 'The data source to use',
    demandOption: true,
  })
  .option('sourceOptions', {
    type: 'string',
    description: 'JSON-serialized options for the chosen data source',
    demandOption: false,
    default: '{}',
  })
  .option('splitter', {
    choices: SUPPORTED_DATA_SPLITTERS,
    description: 'The data splitter to use',
    default: 'text' as const,
  })
  .option('splitterOptions', {
    type: 'string',
    description: 'JSON-serialized options for the chosen data splitter',
    demandOption: false,
    default: '{}',
  })
  .option('embedder', {
    choices: SUPPORTED_DATA_EMBEDDERS,
    description: 'The data embedder to use',
    default: 'openai' as const,
  })
  .option('embedderOptions', {
    type: 'string',
    description: 'JSON-serialized options for the chosen data embedder',
    demandOption: false,
    default: '{}',
  })
  .parseSync();

main();

async function main() {
  const ingestion = new Ingestion({
    store: getVectorStore(argv.store),
    source: getDataSource(argv.source, JSON.parse(argv.sourceOptions)),
    splitter: getDataSplitter(argv.splitter, JSON.parse(argv.splitterOptions)),
    embedder: getDataEmbedder(argv.embedder, JSON.parse(argv.embedderOptions)),
  });

  await ingestion.run();
}

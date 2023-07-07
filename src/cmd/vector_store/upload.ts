import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as cliProgress from 'cli-progress';
import { index } from '../../indexing';
import { getVectorStore } from '../utils';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    type: 'string',
    description: 'The vector store',
    demandOption: true,
  })
  .option('repoPath', {
    type: 'string',
    description: 'Path to the repository',
    demandOption: true,
  })
  .option('globPath', {
    type: 'string',
    description:
      'Glob path relative to repoPath reponsible for finding the specific files to index',
    demandOption: true,
  })
  .parseSync();

index(getVectorStore(argv.store), {
  repoPath: argv.repoPath,
  globPath: argv.globPath,
  progress: new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic),
});

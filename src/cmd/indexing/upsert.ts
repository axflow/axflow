import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as cliProgress from 'cli-progress';
import { upsert } from '../../indexing';

const argv = yargs(hideBin(process.argv))
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

upsert({
  repoPath: argv.repoPath,
  globPath: argv.globPath,
  progressBar: new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic),
});

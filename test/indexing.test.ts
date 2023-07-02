import { getRelativeFilePath } from '../src/indexing';

describe('indexing', () => {
  it('can create ids from file paths', async () => {
    const document1 = '/Users/username/Desktop/phoenix/guides/telemetry.md';
    const document2 = '/Users/username/Desktop/phoenix/guides/deployment/fly.md';
    const repo = '/Users/username/Desktop/phoenix';
    expect(getRelativeFilePath(document1, repo)).toEqual('phoenix/guides/telemetry.md');
    expect(getRelativeFilePath(document2, repo)).toEqual('phoenix/guides/deployment/fly.md');
  });
});

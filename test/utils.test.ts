import { getPathRelativeToDirectory } from '../src/utils';

describe('utils', () => {
  it('can calculate relative file paths', async () => {
    const document1 = '/Users/username/Desktop/phoenix/guides/telemetry.md';
    const document2 = '/Users/username/Desktop/phoenix/guides/deployment/fly.md';
    const dir = '/Users/username/Desktop/phoenix';
    expect(getPathRelativeToDirectory(document1, dir)).toEqual('phoenix/guides/telemetry.md');
    expect(getPathRelativeToDirectory(document2, dir)).toEqual('phoenix/guides/deployment/fly.md');
  });
});

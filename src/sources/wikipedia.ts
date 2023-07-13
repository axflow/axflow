import { SourceNode, DataSource } from '../types';

export const NAME = 'wikipedia' as const;

type Options = {
  term: string;
};

export class Wikipedia implements DataSource {
  private options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  async *iterable(): AsyncIterable<SourceNode> {
    const term = this.options.term;

    const directDoc = await this.fetchDocForTerm(term);

    if (!directDoc) {
      throw new Error(`No Wikipedia page found for term "${term}"`);
    }

    yield {
      url: 'https://wikipedia.org/foo/bar',
      text: directDoc,
    };
  }

  private async fetchDocForTerm(term: string): Promise<string | null> {
    const result = await fetch(
      'https://en.wikipedia.org/w/api.php?' +
        new URLSearchParams({
          action: 'query',
          format: 'json',
          titles: term,
          prop: 'extracts',
          explaintext: 'true',
        }),
      {
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      }
    );

    const jsonResult = await result.json();

    const pages = jsonResult.query?.pages;
    if (!pages || pages['-1']) {
      return null;
    }
    const firstKey = Object.keys(pages)[0];
    return pages[firstKey].extract;
  }
}

import { Document, IDataSource } from '../types';

export const NAME = 'wikipedia' as const;

export type WikipediaOptions = {
  term: string;
};

export class Wikipedia implements IDataSource {
  private options: WikipediaOptions;

  constructor(options: WikipediaOptions) {
    this.options = options;
  }

  async *iterable(): AsyncIterable<Document> {
    const term = this.options.term;

    const doc = await this.fetchDocForTerm(term);

    if (!doc) {
      throw new Error(`No Wikipedia page found for term "${term}"`);
    }

    yield {
      url: `https://en.wikipedia.org/?curid=${doc.id}`,
      text: doc.text,
      metadata: {},
    };
  }

  private async fetchDocForTerm(term: string) {
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

    return {
      id: firstKey,
      text: pages[firstKey].extract,
    };
  }
}

import { chunk as chunkText } from '../chunking/text';
import { generateId } from '../utils';
import type { Document } from '../types';

export const NAME = 'wikipedia' as const;

export async function* read(options: { term: string }) {
  const term = options.term;

  const directDoc = await fetchDocForTerm(term);

  if (!directDoc) {
    throw new Error(`No Wikipedia page found for term "${term}"`);
  }

  const documents: Document[] = [];

  for (const chunk of await chunkText(directDoc)) {
    documents.push({
      id: generateId(),
      text: chunk,
      metadata: { term },
    });
  }

  yield documents;
}

async function fetchDocForTerm(term: string): Promise<string | null> {
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

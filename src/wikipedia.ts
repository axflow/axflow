// Use the wikipedia API directly (libraries were disappointing)
// We use the prop: 'extracts' which has nice sections for chunking
export const fetchDocForTerm = async (term: string): Promise<string | null> => {
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
};

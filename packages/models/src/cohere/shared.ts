export type SharedRequestOptions = {
  apiKey?: string;
  apiUrl?: string;
  fetch?: typeof fetch;
};

export function headers(apiKey?: string) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
  };

  if (typeof apiKey === 'string') {
    headers.authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

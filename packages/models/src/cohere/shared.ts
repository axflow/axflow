export type SharedRequestOptions = {
  apiKey?: string;
  apiUrl?: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export function headers(apiKey?: string, customHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    ...customHeaders,
  };

  if (typeof apiKey === 'string') {
    headers.authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

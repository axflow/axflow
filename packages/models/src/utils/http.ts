export class HttpError extends Error {
  readonly code: number;
  readonly response: Response;

  constructor(message: string, response: Response) {
    super(message);
    this.code = response.status;
    this.response = response;
  }
}

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError;
}

export type HttpOptionsType = RequestInit & { fetch?: typeof fetch };

export async function POST(url: string, options?: HttpOptionsType) {
  const _fetch = options?.fetch ?? fetch;

  if (typeof _fetch === 'undefined') {
    throw new Error(
      'Environment does not support fetch (https://developer.mozilla.org/en-US/docs/Web/API/fetch)',
    );
  }

  const init = { ...options, method: 'POST' };
  delete init.fetch;

  const response = await _fetch(url, init);

  if (!response.ok) {
    throw new HttpError(`Request failed with status code ${response.status}`, response);
  }

  return response;
}

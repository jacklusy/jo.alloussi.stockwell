import {
  AuthError,
  ConflictError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  OfflineError,
  RateLimitError,
  ServerError,
  TimeoutError,
  ValidationError,
  type AppError,
} from '@/core/errors';

type AxiosLikeError = {
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: unknown;
    headers?: Record<string, string>;
  };
  request?: unknown;
};

function fieldMessage(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return 'Invalid request';
  }
  const record = data as Record<string, unknown>;
  if (typeof record.message === 'string') {
    return record.message;
  }
  if (record.errors && typeof record.errors === 'object') {
    const first = Object.values(record.errors as Record<string, unknown>)[0];
    if (typeof first === 'string') {
      return first;
    }
    if (Array.isArray(first) && typeof first[0] === 'string') {
      return first[0];
    }
  }
  return 'Invalid request';
}

export function mapAxiosError(error: unknown): AppError {
  const err = error as AxiosLikeError;

  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return new TimeoutError(err.message);
  }

  if (!err.response) {
    if (err.request) {
      return new OfflineError(err.message ?? 'Offline');
    }
    return new NetworkError(err.message ?? 'Network error');
  }

  const status = err.response.status ?? 500;
  const data = err.response.data;

  switch (status) {
    case 400:
      return new ValidationError(fieldMessage(data), fieldMessage(data));
    case 401:
      return new AuthError();
    case 403:
      return new ForbiddenError();
    case 404:
      return new NotFoundError();
    case 409:
      return new ConflictError();
    case 429: {
      const retryAfter = err.response.headers?.['retry-after'];
      const seconds = retryAfter ? Number(retryAfter) : undefined;
      const retryAfterMs =
        seconds !== undefined && Number.isFinite(seconds) ? seconds * 1000 : undefined;
      return new RateLimitError('Rate limited', retryAfterMs);
    }
    default:
      if (status >= 500) {
        return new ServerError();
      }
      return new ServerError(`Unexpected status ${status}`);
  }
}

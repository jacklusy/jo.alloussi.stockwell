import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { createApiClient } from '@/services/api/client';
import { refreshCoordinator } from '@/services/auth/refresh-coordinator';
import { AuthError, ConflictError, ServerError, ValidationError } from '@/core/errors';

const refreshCalls: string[] = [];

const server = setupServer(
  rest.get('http://localhost/api/v1/secure', (req, res, ctx) => {
    const auth = req.headers.get('Authorization');
    if (auth === 'Bearer access-new') {
      return res(ctx.json({ ok: true }));
    }
    return res(ctx.status(401), ctx.json({ message: 'unauthorized' }));
  }),
  rest.get('http://localhost/api/v1/validation', (_req, res, ctx) =>
    res(ctx.status(400), ctx.json({ message: 'bad field' })),
  ),
  rest.get('http://localhost/api/v1/conflict', (_req, res, ctx) =>
    res(ctx.status(409), ctx.json({ message: 'conflict' })),
  ),
  rest.get('http://localhost/api/v1/boom', (_req, res, ctx) =>
    res(ctx.status(500), ctx.json({ message: 'oops' })),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  refreshCalls.length = 0;
});
afterAll(() => server.close());

jest.mock('@/storage/secure/keychain', () => {
  let tokens: { accessToken: string; refreshToken: string } | null = {
    accessToken: 'access-old',
    refreshToken: 'refresh-old',
  };
  return {
    loadTokens: jest.fn(async () => tokens),
    saveTokens: jest.fn(async (next: { accessToken: string; refreshToken: string }) => {
      tokens = next;
    }),
    clearTokens: jest.fn(async () => {
      tokens = null;
    }),
  };
});

describe('API client', () => {
  it('single-flight refresh: 5 concurrent 401s produce 1 refresh', async () => {
    refreshCoordinator.configure(async () => {
      refreshCalls.push('coord');
      await new Promise<void>((r) => {
        setTimeout(r, 40);
      });
      return { accessToken: 'access-new', refreshToken: 'refresh-new' };
    });

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      getAccessToken: async () => {
        const { loadTokens } = jest.requireMock('@/storage/secure/keychain') as {
          loadTokens: () => Promise<{ accessToken: string } | null>;
        };
        const tokens = await loadTokens();
        return tokens?.accessToken ?? null;
      },
      getTenantId: () => 't1',
    });

    const results = await Promise.all([
      client.get('/secure'),
      client.get('/secure'),
      client.get('/secure'),
      client.get('/secure'),
      client.get('/secure'),
    ]);

    expect(results.every((r) => r.data.ok === true)).toBe(true);
    expect(refreshCalls.filter((c) => c === 'coord')).toHaveLength(1);
  });

  it('maps 400 to ValidationError and does not infinite-retry 4xx', async () => {
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    await expect(client.get('/validation')).rejects.toBeInstanceOf(ValidationError);
  });

  it('maps 409 to ConflictError', async () => {
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    await expect(client.get('/conflict')).rejects.toBeInstanceOf(ConflictError);
  });

  it('maps 500 to ServerError after retries', async () => {
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    await expect(client.get('/boom')).rejects.toBeInstanceOf(ServerError);
  }, 20000);

  it('throws AuthError when refresh fails', async () => {
    refreshCoordinator.configure(async () => {
      throw new Error('refresh failed');
    });
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      getAccessToken: async () => 'access-old',
    });
    await expect(client.get('/secure')).rejects.toBeInstanceOf(AuthError);
  });
});

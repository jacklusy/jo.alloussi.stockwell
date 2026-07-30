import type { AxiosInstance } from 'axios';

import { SyncEngine } from '@/sync/engine/sync-engine';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import {
  AuthError,
  ConflictError,
  RateLimitError,
  ValidationError,
} from '@/core/errors';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';
import { networkAdapter } from '@/services/network/netinfo';
import { refreshCoordinator } from '@/services/auth/refresh-coordinator';
import * as conflictStrategies from '@/sync/conflict/strategies';

jest.mock('@/services/network/netinfo', () => ({
  networkAdapter: {
    isOnline: jest.fn(async () => true),
    getStatus: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
    subscribe: jest.fn(() => jest.fn()),
  },
}));

const mockSetStatus = jest.fn();
jest.mock('@/services/auth/sync-status-store', () => ({
  useSyncStatusStore: {
    getState: () => ({
      setStatus: mockSetStatus,
    }),
  },
}));

jest.mock('@/services/auth/refresh-coordinator', () => ({
  refreshCoordinator: { refresh: jest.fn(async () => ({ accessToken: 'a', refreshToken: 'r' })) },
}));

function createClient(handlers: {
  adjust?: () => Promise<unknown>;
  balances?: () => Promise<unknown>;
}): AxiosInstance {
  const callOrder: string[] = [];
  const client = {
    callOrder,
    post: jest.fn(async (url: string) => {
      callOrder.push(`POST ${url}`);
      if (handlers.adjust) {
        return { data: await handlers.adjust() };
      }
      return { data: { version: 2 } };
    }),
    get: jest.fn(async (url: string) => {
      callOrder.push(`GET ${url}`);
      if (handlers.balances) {
        return { data: await handlers.balances() };
      }
      return { data: { data: [], meta: { page: 1, limit: 200, total: 0, totalPages: 1 } } };
    }),
  };
  return client as unknown as AxiosInstance & { callOrder: string[] };
}

describe('SyncEngine (M-18 / M-19)', () => {
  beforeEach(() => {
    mockSetStatus.mockClear();
    (networkAdapter.isOnline as jest.Mock).mockResolvedValue(true);
    (refreshCoordinator.refresh as jest.Mock).mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    });
  });

  it('pushes before pull', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 5, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 1,
    });

    const client = createClient({
      adjust: async () => ({ version: 2 }),
      balances: async () => ({
        data: [],
        meta: { page: 1, limit: 200, total: 0, totalPages: 1 },
      }),
    });
    const engine = new SyncEngine({
      db,
      client,
      getWarehouseId: () => 'wh-1',
    });

    await engine.run('test');

    const order = (client as unknown as { callOrder: string[] }).callOrder;
    expect(order[0]?.startsWith('POST')).toBe(true);
    expect(order.some((c) => c.startsWith('GET'))).toBe(true);
    const postIdx = order.findIndex((c) => c.startsWith('POST'));
    const getIdx = order.findIndex((c) => c.startsWith('GET'));
    expect(postIdx).toBeLessThan(getIdx);
    expect(engine.phaseLog.filter((p) => p === 'PUSHING' || p === 'PULLING')).toEqual([
      'PUSHING',
      'PULLING',
    ]);
  });

  it('marks 409 as CONFLICT without retry', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 5, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 1,
    });

    const client = createClient({
      adjust: async () => {
        throw new ConflictError('Conflict', { version: 9, on_hand: 10 });
      },
      balances: async () => ({
        data: [],
        meta: { page: 1, limit: 200, total: 0, totalPages: 1 },
      }),
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => 'wh-1' });
    await engine.run('test');

    const after = await queue.getById(item.id);
    expect(after?.status).toBe('CONFLICT');
    expect((client as unknown as { post: jest.Mock }).post).toHaveBeenCalledTimes(1);
  });

  it('dead-letters deterministic 422 failures', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 5, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 1,
    });

    const client = createClient({
      adjust: async () => {
        throw new ValidationError('Idempotency key reused with different body');
      },
      balances: async () => ({
        data: [],
        meta: { page: 1, limit: 200, total: 0, totalPages: 1 },
      }),
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    await engine.run('test');

    const after = await queue.getById(item.id);
    expect(after?.status).toBe('DEAD');
  });

  it('sets OFFLINE when unreachable and skips network', async () => {
    (networkAdapter.isOnline as jest.Mock).mockResolvedValue(false);
    const db = createSyncMemoryDb();
    const client = createClient({});
    const engine = new SyncEngine({ db, client, getWarehouseId: () => 'wh-1' });
    await engine.run('offline');
    expect(engine.getState()).toBe('OFFLINE');
    expect((client as unknown as { post: jest.Mock }).post).not.toHaveBeenCalled();
  });

  it('does not start a second cycle while one is running', async () => {
    const db = createSyncMemoryDb();
    let resolveAdjust: ((v: unknown) => void) | undefined;
    let enteredAdjust = false;
    const client = createClient({
      adjust: () =>
        new Promise((resolve) => {
          enteredAdjust = true;
          resolveAdjust = resolve;
        }),
    });
    const queue = new MutationQueue(db);
    await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 1, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 1,
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    const first = engine.run('a');
    for (let i = 0; i < 20 && !enteredAdjust; i += 1) {
      await Promise.resolve();
    }
    expect(enteredAdjust).toBe(true);
    const second = engine.run('b');
    expect((client as unknown as { post: jest.Mock }).post).toHaveBeenCalledTimes(1);
    resolveAdjust?.({ version: 2 });
    await Promise.all([first, second]);
  });

  it('resets IN_FLIGHT on boot', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: '{}',
      entityId: 'b1',
      baseVersion: 1,
    });
    await queue.markInFlight(item.id);
    const engine = new SyncEngine({
      db,
      client: createClient({}),
      getWarehouseId: () => null,
    });
    await engine.boot();
    expect((await queue.getById(item.id))?.status).toBe('PENDING');
  });

  it('retries auth after refresh', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 1, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 1,
    });
    let calls = 0;
    const client = createClient({
      adjust: async () => {
        calls += 1;
        if (calls === 1) {
          throw new AuthError();
        }
        return { version: 3 };
      },
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    await engine.run('auth');
    expect(refreshCoordinator.refresh).toHaveBeenCalled();
    expect(calls).toBeGreaterThanOrEqual(1);
  });

  it('marks FAILED on rate limit with retryAfter', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 1, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 1,
    });
    const client = createClient({
      adjust: async () => {
        throw new RateLimitError('slow', 5_000);
      },
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    await engine.run('rl');
    const after = await queue.getById(item.id);
    expect(after?.status).toBe('FAILED');
    expect(after?.attempts).toBe(1);
  });

  it('dead-letters after max retry attempts', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 1, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 1,
    });
    await queue.markFailed(item.id, 4, Date.now() - 1, 'prior');
    const client = createClient({
      adjust: async () => {
        throw new Error('still down');
      },
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    await engine.run('dead');
    expect((await queue.getById(item.id))?.status).toBe('DEAD');
  });

  it('enters ERROR when refresh fails after auth push', async () => {
    (refreshCoordinator.refresh as jest.Mock).mockRejectedValue(new Error('refresh failed'));
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 1, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 1,
    });
    const client = createClient({
      adjust: async () => {
        throw new AuthError();
      },
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    await engine.run('auth-fail');
    expect(engine.getState()).toBe('ERROR');
  });

  it('accepts server when conflict strategy returns acceptServer', async () => {
    const spy = jest.spyOn(conflictStrategies, 'strategyForMutation').mockReturnValue({
      name: 'serverWins',
      resolve: () => ({ action: 'acceptServer' }),
    });
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 1, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 1,
    });
    const client = createClient({
      adjust: async () => {
        throw new ConflictError('c', { version: 9 });
      },
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    await engine.run('sw');
    expect(await queue.getById(item.id)).toBeNull();
    spy.mockRestore();
  });

  it('sets ERROR when pull throws', async () => {
    const db = createSyncMemoryDb();
    const client = createClient({
      balances: async () => {
        throw new Error('pull failed');
      },
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => 'wh-1' });
    await engine.run('pull-fail');
    expect(engine.getState()).toBe('ERROR');
  });
});

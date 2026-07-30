import type { AxiosInstance } from 'axios';

import { SyncEngine } from '@/sync/engine/sync-engine';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import { ConflictError, ValidationError } from '@/core/errors';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';

jest.mock('@/services/network/netinfo', () => ({
  networkAdapter: {
    isOnline: jest.fn(async () => true),
    getStatus: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
    subscribe: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@/services/auth/sync-status-store', () => ({
  useSyncStatusStore: {
    getState: () => ({
      setStatus: jest.fn(),
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
});

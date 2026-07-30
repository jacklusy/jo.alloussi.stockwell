/**
 * M-25 — Five mandatory offline-sync suites (portfolio evidence).
 *
 * Run: npm test -- __tests__/integration/offline-sync.suite.test.ts
 * Capture for README: npm run test:offline-sync
 */
import type { AxiosInstance } from 'axios';

import { Result } from '@/core/domain';
import { ConflictError } from '@/core/errors';
import { createAdjustStockUseCase } from '@/features/inventory/application/use-cases/adjust-stock.usecase';
import { createResolveConflictUseCase } from '@/features/inventory/application/use-cases/resolve-conflict.usecase';
import { createLogoutUseCase } from '@/features/auth/application/use-cases/logout.usecase';
import type { StockBalance } from '@/features/inventory/domain/entities/stock-balance';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import type { AuthRepository } from '@/features/auth/domain/repositories/auth.repository';
import { SyncEngine } from '@/sync/engine/sync-engine';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import { ConflictStore } from '@/sync/conflict/conflict-store';
import { wipeLocalTenantData } from '@/services/auth/logout-wipe';
import { asBalanceId, asLocationId, asProductId, asTenantId, asWarehouseId } from '@/types/ids';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';
import * as keychain from '@/storage/secure/keychain';

const mockIsOnline = jest.fn(async () => false);

jest.mock('@/services/network/netinfo', () => ({
  networkAdapter: {
    isOnline: () => mockIsOnline(),
    getStatus: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
    subscribe: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@/services/auth/sync-status-store', () => ({
  useSyncStatusStore: {
    getState: () => ({
      setStatus: jest.fn(),
      clear: jest.fn(),
    }),
  },
}));

jest.mock('@/services/auth/refresh-coordinator', () => ({
  refreshCoordinator: {
    refresh: jest.fn(async () => ({ accessToken: 'a', refreshToken: 'r' })),
  },
}));

function seedBalance(overrides: Partial<StockBalance> = {}): StockBalance {
  return {
    id: asBalanceId('bal-1'),
    tenantId: asTenantId('t1'),
    warehouseId: asWarehouseId('w1'),
    locationId: asLocationId('l1'),
    productId: asProductId('p1'),
    sku: 'SKU-1',
    productName: 'Widget',
    locationCode: 'A-01',
    onHand: 100,
    reserved: 0,
    version: 7,
    pendingSync: false,
    updatedAt: Date.now(),
    ...overrides,
  };
}

function fakeBalances(initial: StockBalance): {
  repo: StockBalanceRepository;
  getCurrent: () => StockBalance;
} {
  let current = initial;
  return {
    getCurrent: () => current,
    repo: {
      list: async () => Result.ok({ items: [current], total: 1, page: 1, limit: 50 }),
      getById: async () => Result.ok(current),
      getBySku: async () => Result.ok(current),
      upsertMany: async () => Result.ok(undefined),
      applyOptimisticDelta: async (_id, delta) => {
        current = {
          ...current,
          onHand: current.onHand + delta,
          pendingSync: true,
        };
        return Result.ok(current);
      },
      applyAuthoritative: async (_id, onHand, version) => {
        current = { ...current, onHand, version, pendingSync: false };
        return Result.ok(undefined);
      },
    },
  };
}

function createTrackingClient(opts?: {
  onAdjust?: (headers: Record<string, unknown>) => Promise<unknown> | unknown;
}): AxiosInstance & { movements: string[]; posts: number } {
  const movements: string[] = [];
  const state = { posts: 0 };
  const client = {
    movements,
    get posts() {
      return state.posts;
    },
    post: jest.fn(async (_url: string, _body: unknown, config?: {
      headers?: Record<string, unknown>;
      idempotencyKey?: string;
    }) => {
      state.posts += 1;
      const key = String(
        config?.idempotencyKey ??
          config?.headers?.['Idempotency-Key'] ??
          config?.headers?.['idempotency-key'] ??
          '',
      );
      if (opts?.onAdjust) {
        const data = await opts.onAdjust({
          ...(config?.headers ?? {}),
          'Idempotency-Key': key,
        });
        return { data };
      }
      if (key && !movements.includes(key)) {
        movements.push(key);
      }
      return { data: { version: 8, movement_id: `m-${key}` } };
    }),
    get: jest.fn(async () => ({
      data: { data: [], meta: { page: 1, limit: 200, total: 0, totalPages: 1 } },
    })),
  };
  return client as unknown as AxiosInstance & { movements: string[]; posts: number };
}

describe('Offline-sync mandatory suite (M-25)', () => {
  beforeEach(() => {
    mockIsOnline.mockReset();
    mockIsOnline.mockResolvedValue(false);
  });

  it('1. Offline mutation → queued → reconnect → synced → exactly one server movement', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const { repo, getCurrent } = fakeBalances(seedBalance());
    const client = createTrackingClient();
    const engine = new SyncEngine({
      db,
      client,
      getWarehouseId: () => 'w1',
    });
    const adjust = createAdjustStockUseCase({
      balances: repo,
      queue,
      syncEngine: engine,
    });

    const offline = await adjust.execute({
      balanceId: asBalanceId('bal-1'),
      delta: 50,
      reason: 'recount',
    });
    expect(offline.ok).toBe(true);
    expect(getCurrent().onHand).toBe(150);
    expect(getCurrent().pendingSync).toBe(true);
    expect(await queue.dequeueNext()).not.toBeNull();
    expect(client.posts).toBe(0);

    mockIsOnline.mockResolvedValue(true);
    await engine.run('reconnect');

    expect(client.movements).toHaveLength(1);
    expect(await queue.dequeueNext()).toBeNull();
  });

  it('2. Idempotent replay — double push of same item → one server movement', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'bal-1', delta: 1, reason: 'x' }),
      entityId: 'bal-1',
      baseVersion: 1,
      idempotencyKey: 'idem-stable',
    });

    const seen = new Set<string>();
    const client = createTrackingClient({
      onAdjust: (headers) => {
        const key = String(headers['Idempotency-Key'] ?? '');
        if (seen.has(key)) {
          // Server returns original response for same key
          return { version: 2, movement_id: 'm-idem-stable', replayed: true };
        }
        seen.add(key);
        return { version: 2, movement_id: 'm-idem-stable' };
      },
    });

    // First push deletes item; re-enqueue same key to simulate interrupted ack
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    mockIsOnline.mockResolvedValue(true);
    await engine.run('first');
    expect(seen.size).toBe(1);

    await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'bal-1', delta: 1, reason: 'x' }),
      entityId: 'bal-1',
      baseVersion: 1,
      idempotencyKey: item.idempotencyKey,
    });
    await engine.run('replay');
    expect(seen.size).toBe(1);
    expect(client.posts).toBe(2);
  });

  it('3. Conflict — 409 → CONFLICT → retry on new base applies', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const conflicts = new ConflictStore(db);
    const { repo } = fakeBalances(seedBalance({ version: 7 }));
    const client = createTrackingClient({
      onAdjust: () => {
        throw new ConflictError('Conflict', { version: 9, on_hand: 80 });
      },
    });
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'bal-1', delta: 50, reason: 'count' }),
      entityId: 'bal-1',
      baseVersion: 7,
    });

    mockIsOnline.mockResolvedValue(true);
    await engine.run('conflict');
    const after = await queue.getById(item.id);
    expect(after?.status).toBe('CONFLICT');

    const resolve = createResolveConflictUseCase({
      queue,
      conflicts,
      balances: repo,
      syncEngine: engine,
    });

    // Switch client to succeed on retry
    (client.post as jest.Mock).mockImplementation(async (_u, _b, config) => {
      const key = String(config?.headers?.['Idempotency-Key'] ?? '');
      client.movements.push(key);
      return { data: { version: 10 } };
    });

    const resolved = await resolve.execute(item.id, { kind: 'retryOnNewBase' });
    expect(resolved.ok).toBe(true);
    const retried = await queue.getById(item.id);
    expect(retried?.status).toBe('PENDING');
    expect(retried?.baseVersion).toBe(9);

    await engine.run('after-resolve');
    expect(await queue.getById(item.id)).toBeNull();
  });

  it('4. Interrupted sync — IN_FLIGHT reset → resume, nothing duplicated', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'bal-1', delta: 3, reason: 'x' }),
      entityId: 'bal-1',
      baseVersion: 1,
      idempotencyKey: 'kill-mid-sync',
    });
    await queue.markInFlight(item.id);

    const restarted = new MutationQueue(db);
    const reset = await restarted.resetInFlight();
    expect(reset).toBe(1);

    const client = createTrackingClient();
    const engine = new SyncEngine({ db, client, getWarehouseId: () => null });
    mockIsOnline.mockResolvedValue(true);
    await engine.boot();
    await engine.run('resume');

    expect(client.movements).toEqual(['kill-mid-sync']);
    expect(client.posts).toBe(1);
    expect(await queue.getById(item.id)).toBeNull();
  });

  it('5. Logout wipe — local tenant data and keychain cleared', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'bal-1', delta: 1, reason: 'x' }),
      entityId: 'bal-1',
      baseVersion: 1,
    });
    await keychain.saveTokens({ accessToken: 'access', refreshToken: 'refresh' });

    const wipe = await wipeLocalTenantData(db, { wipeQueue: true });
    expect(wipe.ok).toBe(true);
    expect(await queue.dequeueNext()).toBeNull();
    expect(await keychain.loadTokens()).toBeNull();

    const auth: AuthRepository = {
      login: async () => Result.err(new ConflictError()),
      refresh: async () => Result.err(new ConflictError()),
      logout: jest.fn(async () => Result.ok(undefined)),
    };
    const logout = createLogoutUseCase({ auth, db, queue });
    mockIsOnline.mockResolvedValue(true);
    const again = await logout.execute({ confirmQueueDiscard: true });
    expect(again.ok).toBe(true);
    expect(auth.logout).toHaveBeenCalled();
  });
});

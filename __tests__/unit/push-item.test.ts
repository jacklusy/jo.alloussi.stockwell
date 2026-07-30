import {
  AuthError,
  ConflictError,
  ForbiddenError,
  RateLimitError,
  ValidationError,
} from '@/core/errors';
import { pushQueueItem } from '@/sync/queue/push-item';
import type { QueueItem } from '@/sync/types';

const item: QueueItem = {
  id: 'q1',
  idempotencyKey: 'k1',
  type: 'ADJUST_STOCK',
  payload: JSON.stringify({ balanceId: 'b1', delta: 2, reason: 'count' }),
  entityId: 'b1',
  baseVersion: 1,
  status: 'PENDING',
  attempts: 0,
  nextAttemptAt: null,
  lastError: null,
  createdAt: 1,
};

describe('pushQueueItem', () => {
  it('returns ok with server version', async () => {
    const client = {
      post: jest.fn(async () => ({ data: { version: 4 } })),
    };
    await expect(pushQueueItem(client as never, item)).resolves.toEqual({
      kind: 'ok',
      serverVersion: 4,
    });
  });

  it('maps conflict / auth / validation / forbidden / rate-limit / network', async () => {
    const cases: Array<{ err: Error; kind: string }> = [
      { err: new ConflictError('c', { version: 9 }), kind: 'conflict' },
      { err: new AuthError(), kind: 'auth' },
      { err: new ValidationError('bad'), kind: 'dead' },
      { err: new ForbiddenError(), kind: 'dead' },
      { err: new RateLimitError('slow', 1000), kind: 'retry' },
      { err: new Error('boom'), kind: 'retry' },
    ];
    for (const c of cases) {
      const client = {
        post: jest.fn(async () => {
          throw c.err;
        }),
      };
      const result = await pushQueueItem(client as never, item);
      expect(result.kind).toBe(c.kind);
    }
  });

  it('dead-letters unsupported mutation types', async () => {
    const client = { post: jest.fn() };
    const result = await pushQueueItem(client as never, {
      ...item,
      type: 'TRANSFER_STOCK',
    });
    expect(result).toEqual({
      kind: 'dead',
      error: 'Unsupported mutation type: TRANSFER_STOCK',
    });
  });
});

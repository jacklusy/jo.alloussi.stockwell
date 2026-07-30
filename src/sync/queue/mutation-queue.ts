import type { DB } from '@op-engineering/op-sqlite';

import { createId } from '@/core/utils/id';
import type {
  MutationType,
  QueueItem,
  QueueItemStatus,
} from '@/sync/types';

export type EnqueueInput = {
  type: MutationType;
  payload: string;
  entityId: string;
  baseVersion: number;
  /** Optional — generated once at enqueue if omitted. Never regenerated on retry. */
  idempotencyKey?: string;
};

type QueueRow = {
  id: string;
  idempotency_key: string;
  type: string;
  payload: string;
  entity_id: string;
  base_version: number;
  status: string;
  attempts: number;
  next_attempt_at: number | null;
  last_error: string | null;
  created_at: number;
};

function mapRow(row: QueueRow): QueueItem {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    type: row.type as MutationType,
    payload: row.payload,
    entityId: row.entity_id,
    baseVersion: row.base_version,
    status: row.status as QueueItemStatus,
    attempts: row.attempts,
    nextAttemptAt: row.next_attempt_at,
    lastError: row.last_error,
    createdAt: row.created_at,
  };
}

/**
 * Persistent mutation queue. FIFO by created_at.
 * Idempotency key is generated once at enqueue and never regenerated.
 */
export class MutationQueue {
  constructor(private readonly db: DB) {}

  async enqueue(input: EnqueueInput): Promise<QueueItem> {
    const id = createId();
    const idempotencyKey = input.idempotencyKey ?? createId();
    const createdAt = Date.now();
    await this.db.execute(
      `INSERT INTO mutation_queue (
         id, idempotency_key, type, payload, entity_id, base_version,
         status, attempts, next_attempt_at, last_error, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, NULL, NULL, ?)`,
      [
        id,
        idempotencyKey,
        input.type,
        input.payload,
        input.entityId,
        input.baseVersion,
        createdAt,
      ],
    );
    return {
      id,
      idempotencyKey,
      type: input.type,
      payload: input.payload,
      entityId: input.entityId,
      baseVersion: input.baseVersion,
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: null,
      lastError: null,
      createdAt,
    };
  }

  /** Next PENDING (or FAILED past backoff) item in FIFO order. */
  async dequeueNext(now = Date.now()): Promise<QueueItem | null> {
    const result = await this.db.execute(
      `SELECT * FROM mutation_queue
       WHERE status = 'PENDING'
          OR (status = 'FAILED' AND (next_attempt_at IS NULL OR next_attempt_at <= ?))
       ORDER BY created_at ASC
       LIMIT 1`,
      [now],
    );
    const row = result.rows[0] as QueueRow | undefined;
    return row ? mapRow(row) : null;
  }

  async markInFlight(id: string): Promise<void> {
    await this.db.execute(
      `UPDATE mutation_queue SET status = 'IN_FLIGHT' WHERE id = ?`,
      [id],
    );
  }

  async markPending(id: string): Promise<void> {
    await this.db.execute(
      `UPDATE mutation_queue SET status = 'PENDING', next_attempt_at = NULL WHERE id = ?`,
      [id],
    );
  }

  async markFailed(
    id: string,
    attempts: number,
    nextAttemptAt: number,
    lastError: string,
  ): Promise<void> {
    await this.db.execute(
      `UPDATE mutation_queue
       SET status = 'FAILED', attempts = ?, next_attempt_at = ?, last_error = ?
       WHERE id = ?`,
      [attempts, nextAttemptAt, lastError, id],
    );
  }

  async markConflict(id: string, lastError: string): Promise<void> {
    await this.db.execute(
      `UPDATE mutation_queue SET status = 'CONFLICT', last_error = ? WHERE id = ?`,
      [lastError, id],
    );
  }

  async markDead(id: string, lastError: string): Promise<void> {
    await this.db.execute(
      `UPDATE mutation_queue SET status = 'DEAD', last_error = ? WHERE id = ?`,
      [lastError, id],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM mutation_queue WHERE id = ?`, [id]);
  }

  async updateBaseVersion(id: string, baseVersion: number): Promise<void> {
    await this.db.execute(
      `UPDATE mutation_queue SET base_version = ?, status = 'PENDING', last_error = NULL WHERE id = ?`,
      [baseVersion, id],
    );
  }

  /** Reset IN_FLIGHT → PENDING on boot (interrupted sync). */
  async resetInFlight(): Promise<number> {
    const before = await this.db.execute(
      `SELECT COUNT(*) AS c FROM mutation_queue WHERE status = 'IN_FLIGHT'`,
    );
    await this.db.execute(
      `UPDATE mutation_queue SET status = 'PENDING' WHERE status = 'IN_FLIGHT'`,
    );
    return Number((before.rows[0] as { c?: number } | undefined)?.c ?? 0);
  }

  async listByStatus(statuses: QueueItemStatus[]): Promise<QueueItem[]> {
    if (statuses.length === 0) {
      return [];
    }
    const placeholders = statuses.map(() => '?').join(',');
    const result = await this.db.execute(
      `SELECT * FROM mutation_queue
       WHERE status IN (${placeholders})
       ORDER BY created_at ASC`,
      statuses,
    );
    return (result.rows as QueueRow[]).map(mapRow);
  }

  async countByStatus(): Promise<Record<QueueItemStatus, number>> {
    const result = await this.db.execute(
      `SELECT status, COUNT(*) AS c FROM mutation_queue GROUP BY status`,
    );
    const counts: Record<QueueItemStatus, number> = {
      PENDING: 0,
      IN_FLIGHT: 0,
      FAILED: 0,
      CONFLICT: 0,
      DEAD: 0,
    };
    for (const row of result.rows as Array<{ status: QueueItemStatus; c: number }>) {
      counts[row.status] = Number(row.c);
    }
    return counts;
  }

  async getById(id: string): Promise<QueueItem | null> {
    const result = await this.db.execute(
      `SELECT * FROM mutation_queue WHERE id = ? LIMIT 1`,
      [id],
    );
    const row = result.rows[0] as QueueRow | undefined;
    return row ? mapRow(row) : null;
  }

  /**
   * True when the entity still has work that must win over a live server delta.
   * DEAD items do not block — they are terminal and visible in sync centre.
   */
  async hasPendingForEntity(entityId: string): Promise<boolean> {
    const result = await this.db.execute(
      `SELECT COUNT(*) AS c FROM mutation_queue
       WHERE entity_id = ?
         AND status IN ('PENDING', 'IN_FLIGHT', 'FAILED', 'CONFLICT')`,
      [entityId],
    );
    return Number((result.rows[0] as { c?: number } | undefined)?.c ?? 0) > 0;
  }
}

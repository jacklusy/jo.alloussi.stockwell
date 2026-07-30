import type { DB } from '@op-engineering/op-sqlite';

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

type ConflictRow = {
  queue_item_id: string;
  local_payload: string;
  server_state: string;
  detected_at: number;
  resolution: string | null;
};

type SyncStateRow = {
  entity: string;
  last_pulled_at: number | null;
  cursor: string | null;
  last_full_sync_at: number | null;
};

type BalanceRow = {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  location_id: string;
  product_id: string;
  on_hand: number;
  reserved: number;
  version: number;
  pending_sync: number;
  updated_at: number;
};

/**
 * In-memory SQLite stand-in for sync/queue tests.
 * Production uses op-sqlite; this exercises SQL shape and queue semantics.
 */
export function createSyncMemoryDb(): DB {
  const queue: QueueRow[] = [];
  const conflicts: ConflictRow[] = [];
  const syncState: SyncStateRow[] = [];
  const balances: BalanceRow[] = [];

  const api = {
    async execute(query: string, params: unknown[] = []) {
      const q = query.replace(/\s+/g, ' ').trim();

      if (q.startsWith('INSERT INTO mutation_queue')) {
        queue.push({
          id: params[0] as string,
          idempotency_key: params[1] as string,
          type: params[2] as string,
          payload: params[3] as string,
          entity_id: params[4] as string,
          base_version: params[5] as number,
          status: 'PENDING',
          attempts: 0,
          next_attempt_at: null,
          last_error: null,
          created_at: params[6] as number,
        });
        return { rows: [] };
      }

      if (/^DELETE FROM mutation_queue\b/i.test(q)) {
        if (!/\bWHERE\b/i.test(q)) {
          queue.length = 0;
          return { rows: [] };
        }
        const id = params[0] as string;
        const idx = queue.findIndex((r) => r.id === id);
        if (idx >= 0) {
          queue.splice(idx, 1);
        }
        return { rows: [] };
      }

      if (/^DELETE FROM conflicts\b/i.test(q)) {
        if (!/\bWHERE\b/i.test(q)) {
          conflicts.length = 0;
          return { rows: [] };
        }
        const id = params[0] as string;
        const idx = conflicts.findIndex((c) => c.queue_item_id === id);
        if (idx >= 0) {
          conflicts.splice(idx, 1);
        }
        return { rows: [] };
      }

      if (/^DELETE FROM (\w+)/i.test(q)) {
        const table = /^DELETE FROM (\w+)/i.exec(q)?.[1];
        if (table === 'sync_state') {
          syncState.length = 0;
        }
        if (table === 'stock_balances') {
          balances.length = 0;
        }
        return { rows: [] };
      }

      if (
        q.startsWith('SELECT') &&
        q.includes('FROM mutation_queue') &&
        q.includes('ORDER BY created_at ASC') &&
        q.includes('LIMIT 1')
      ) {
        const now = (params[0] as number) ?? Date.now();
        const next = queue
          .filter(
            (row) =>
              row.status === 'PENDING' ||
              (row.status === 'FAILED' &&
                (row.next_attempt_at === null || row.next_attempt_at <= now)),
          )
          .sort((a, b) => a.created_at - b.created_at)[0];
        return { rows: next ? [next] : [] };
      }

      if (q.startsWith('SELECT') && q.includes('FROM mutation_queue WHERE status IN')) {
        const statuses = params as string[];
        return {
          rows: queue
            .filter((row) => statuses.includes(row.status))
            .sort((a, b) => a.created_at - b.created_at),
        };
      }

      if (
        q.startsWith('SELECT COUNT(*) AS c FROM mutation_queue') &&
        q.includes('entity_id = ?') &&
        q.includes('status IN')
      ) {
        const entityId = params[0] as string;
        const active = new Set(['PENDING', 'IN_FLIGHT', 'FAILED', 'CONFLICT']);
        return {
          rows: [
            {
              c: queue.filter((r) => r.entity_id === entityId && active.has(r.status))
                .length,
            },
          ],
        };
      }

      if (q.startsWith('SELECT COUNT(*) AS c FROM mutation_queue WHERE status =')) {
        const statusMatch = /status = '(\w+)'/.exec(q);
        const status = statusMatch?.[1] ?? (params[0] as string);
        return { rows: [{ c: queue.filter((r) => r.status === status).length }] };
      }

      if (q.startsWith('SELECT status, COUNT(*) AS c FROM mutation_queue')) {
        const counts = new Map<string, number>();
        for (const row of queue) {
          counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
        }
        return {
          rows: [...counts.entries()].map(([status, c]) => ({ status, c })),
        };
      }

      if (q.startsWith('SELECT') && q.includes('FROM mutation_queue WHERE id =')) {
        const id = params[0] as string;
        const row = queue.find((r) => r.id === id);
        return { rows: row ? [row] : [] };
      }

      if (q.startsWith('SELECT') && q.includes('FROM mutation_queue') && !q.includes('WHERE')) {
        return { rows: [...queue] };
      }

      if (q.startsWith('UPDATE mutation_queue SET status = \'IN_FLIGHT\'')) {
        const id = params[0] as string;
        const row = queue.find((r) => r.id === id);
        if (row) {
          row.status = 'IN_FLIGHT';
        }
        return { rows: [] };
      }

      if (q.startsWith('UPDATE mutation_queue SET status = \'PENDING\', next_attempt_at')) {
        const id = params[0] as string;
        const row = queue.find((r) => r.id === id);
        if (row) {
          row.status = 'PENDING';
          row.next_attempt_at = null;
        }
        return { rows: [] };
      }

      if (q.startsWith('UPDATE mutation_queue SET status = \'PENDING\' WHERE status = \'IN_FLIGHT\'')) {
        for (const row of queue) {
          if (row.status === 'IN_FLIGHT') {
            row.status = 'PENDING';
          }
        }
        return { rows: [] };
      }

      if (q.includes('SET status = \'FAILED\'')) {
        const [attempts, nextAttemptAt, lastError, id] = params as [
          number,
          number,
          string,
          string,
        ];
        const row = queue.find((r) => r.id === id);
        if (row) {
          row.status = 'FAILED';
          row.attempts = attempts;
          row.next_attempt_at = nextAttemptAt;
          row.last_error = lastError;
        }
        return { rows: [] };
      }

      if (q.includes('SET status = \'CONFLICT\'')) {
        const [lastError, id] = params as [string, string];
        const row = queue.find((r) => r.id === id);
        if (row) {
          row.status = 'CONFLICT';
          row.last_error = lastError;
        }
        return { rows: [] };
      }

      if (q.includes('SET status = \'DEAD\'')) {
        const [lastError, id] = params as [string, string];
        const row = queue.find((r) => r.id === id);
        if (row) {
          row.status = 'DEAD';
          row.last_error = lastError;
        }
        return { rows: [] };
      }

      if (q.startsWith('UPDATE mutation_queue SET base_version')) {
        const [baseVersion, id] = params as [number, string];
        const row = queue.find((r) => r.id === id);
        if (row) {
          row.base_version = baseVersion;
          row.status = 'PENDING';
          row.last_error = null;
        }
        return { rows: [] };
      }

      if (q.startsWith('INSERT OR REPLACE INTO conflicts') || q.startsWith('INSERT INTO conflicts')) {
        const [queueItemId, localPayload, serverState, detectedAt] = params as [
          string,
          string,
          string,
          number,
        ];
        const existing = conflicts.findIndex((c) => c.queue_item_id === queueItemId);
        const row: ConflictRow = {
          queue_item_id: queueItemId,
          local_payload: localPayload,
          server_state: serverState,
          detected_at: detectedAt,
          resolution: null,
        };
        if (existing >= 0) {
          conflicts[existing] = row;
        } else {
          conflicts.push(row);
        }
        return { rows: [] };
      }

      if (q.startsWith('SELECT') && q.includes('FROM conflicts')) {
        return { rows: [...conflicts].sort((a, b) => a.detected_at - b.detected_at) };
      }

      if (q.startsWith('UPDATE conflicts SET resolution')) {
        const [resolution, id] = params as [string, string];
        const row = conflicts.find((c) => c.queue_item_id === id);
        if (row) {
          row.resolution = resolution;
        }
        return { rows: [] };
      }

      if (q.startsWith('SELECT') && q.includes('FROM sync_state')) {
        const entity = params[0] as string;
        const row = syncState.find((s) => s.entity === entity);
        return { rows: row ? [row] : [] };
      }

      if (q.startsWith('INSERT INTO sync_state') || q.includes('INSERT INTO sync_state')) {
        const [entity, lastPulledAt, cursor, lastFull] = params as [
          string,
          number,
          string,
          number | null,
        ];
        const existing = syncState.find((s) => s.entity === entity);
        if (existing) {
          existing.last_pulled_at = lastPulledAt;
          existing.cursor = cursor;
          if (lastFull != null) {
            existing.last_full_sync_at = lastFull;
          }
        } else {
          syncState.push({
            entity,
            last_pulled_at: lastPulledAt,
            cursor,
            last_full_sync_at: lastFull,
          });
        }
        return { rows: [] };
      }

      if (q.startsWith('INSERT INTO stock_balances') || q.startsWith('INSERT OR REPLACE INTO stock_balances')) {
        balances.push({
          id: params[0] as string,
          tenant_id: (params[1] as string) ?? 't1',
          warehouse_id: (params[2] as string) ?? 'wh1',
          location_id: (params[3] as string) ?? 'loc1',
          product_id: (params[4] as string) ?? 'p1',
          on_hand: (params[5] as number) ?? 0,
          reserved: (params[6] as number) ?? 0,
          version: (params[7] as number) ?? 1,
          pending_sync: (params[8] as number) ?? 0,
          updated_at: (params[9] as number) ?? Date.now(),
        });
        return { rows: [] };
      }

      if (q.startsWith('SELECT') && q.includes('FROM stock_balances') && q.includes('WHERE id')) {
        const id = params[0] as string;
        const row = balances.find((b) => b.id === id);
        return { rows: row ? [row] : [] };
      }

      if (
        q.startsWith('UPDATE stock_balances') &&
        q.includes('on_hand') &&
        q.includes('reserved') &&
        q.includes('version')
      ) {
        const [onHand, reserved, version, updatedAt, id] = params as [
          number,
          number,
          number,
          number,
          string,
        ];
        const row = balances.find((b) => b.id === id);
        if (row) {
          row.on_hand = onHand;
          row.reserved = reserved;
          row.version = version;
          row.pending_sync = 0;
          row.updated_at = updatedAt;
        }
        return { rows: [] };
      }

      if (q.startsWith('UPDATE stock_balances') && q.includes('pending_sync = 0')) {
        const [version, updatedAt, id] = params as [number, number, string];
        const row = balances.find((b) => b.id === id);
        if (row) {
          row.version = version;
          row.pending_sync = 0;
          row.updated_at = updatedAt;
        }
        return { rows: [] };
      }

      if (q.startsWith('UPDATE stock_balances') && q.includes('pending_sync = 1')) {
        const [onHand, updatedAt, id] = params as [number, number, string];
        const row = balances.find((b) => b.id === id);
        if (row) {
          row.on_hand = onHand;
          row.pending_sync = 1;
          row.updated_at = updatedAt;
        }
        return { rows: [] };
      }

      return { rows: [] };
    },
    close() {
      return undefined;
    },
  };

  return api as unknown as DB;
}

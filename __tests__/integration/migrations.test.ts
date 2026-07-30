import type { DB } from '@op-engineering/op-sqlite';

import { migrateTo, MIGRATIONS } from '@/storage/db/migrations';

/**
 * In-memory fake for migration tests — exercises SQL statements without native SQLite.
 * Production uses op-sqlite; this verifies queue-preserving migration order.
 */
function createMemoryDb(): DB & { dump: () => Map<string, unknown[]> } {
  const tables = new Map<string, unknown[]>();
  tables.set('schema_migrations', []);
  tables.set('mutation_queue', []);

  const api = {
    async execute(query: string, params: unknown[] = []) {
      const q = query.trim();
      if (q.startsWith('CREATE TABLE IF NOT EXISTS schema_migrations')) {
        return { rows: [] };
      }
      if (q.startsWith('CREATE TABLE') || q.startsWith('CREATE INDEX') || q.startsWith('CREATE UNIQUE')) {
        const match = /CREATE TABLE IF NOT EXISTS (\w+)/.exec(q);
        if (match?.[1] && !tables.has(match[1])) {
          tables.set(match[1], []);
        }
        return { rows: [] };
      }
      if (q.startsWith('ALTER TABLE')) {
        return { rows: [] };
      }
      if (q.includes('FROM schema_migrations')) {
        const rows = tables.get('schema_migrations') ?? [];
        const max = rows.reduce((acc: number, row) => {
          const version = Number((row as { version: number }).version);
          return Math.max(acc, version);
        }, 0);
        return { rows: [{ version: max }] };
      }
      if (q.startsWith('INSERT OR REPLACE INTO schema_migrations')) {
        const version = params[0] as number;
        const appliedAt = params[1] as number;
        const rows = tables.get('schema_migrations') ?? [];
        tables.set(
          'schema_migrations',
          [...rows.filter((r) => (r as { version: number }).version !== version), { version, applied_at: appliedAt }],
        );
        return { rows: [] };
      }
      if (q.startsWith('INSERT INTO mutation_queue')) {
        const row = {
          id: params[0],
          idempotency_key: params[1],
          payload: params[2],
        };
        tables.get('mutation_queue')?.push(row);
        return { rows: [] };
      }
      if (q.includes('FROM mutation_queue')) {
        return { rows: tables.get('mutation_queue') ?? [] };
      }
      return { rows: [] };
    },
    close() {
      return undefined;
    },
    dump() {
      return tables;
    },
  };

  return api as unknown as DB & { dump: () => Map<string, unknown[]> };
}

describe('DB migrations', () => {
  it('v1 → v2 preserves a populated mutation_queue', async () => {
    const db = createMemoryDb();
    await migrateTo(db, 1);

    await db.execute(
      'INSERT INTO mutation_queue (id, idempotency_key, payload) VALUES (?, ?, ?)',
      ['q1', 'idem-1', '{"delta":5}'],
    );
    await db.execute(
      'INSERT INTO mutation_queue (id, idempotency_key, payload) VALUES (?, ?, ?)',
      ['q2', 'idem-2', '{"delta":-2}'],
    );

    expect(MIGRATIONS[2]?.some((s) => s.includes('mutation_queue') && s.includes('DROP'))).toBe(
      false,
    );

    await migrateTo(db, 2);

    const queued = await db.execute('SELECT * FROM mutation_queue');
    expect(queued.rows).toHaveLength(2);
    expect(queued.rows.map((r) => (r as { idempotency_key: string }).idempotency_key)).toEqual([
      'idem-1',
      'idem-2',
    ]);
  });
});

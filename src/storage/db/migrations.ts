import type { DB } from '@op-engineering/op-sqlite';

import { SCHEMA_VERSION } from '@/storage/db/schema';
import { logger } from '@/services/logging/logger';

/**
 * Explicit SQL migrations. mutation_queue is never dropped.
 * v1 → v2 must preserve a populated queue (tested).
 */
const MIGRATIONS: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS locations_warehouse_idx ON locations(warehouse_id)`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS products_tenant_sku_idx ON products(tenant_id, sku)`,
    `CREATE TABLE IF NOT EXISTS stock_balances (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      on_hand REAL NOT NULL,
      reserved REAL NOT NULL,
      version INTEGER NOT NULL,
      pending_sync INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS balances_warehouse_idx ON stock_balances(warehouse_id)`,
    `CREATE INDEX IF NOT EXISTS balances_product_idx ON stock_balances(product_id)`,
    `CREATE INDEX IF NOT EXISTS balances_location_idx ON stock_balances(location_id)`,
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY NOT NULL,
      tenant_id TEXT NOT NULL,
      balance_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      reason TEXT,
      note TEXT,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS movements_balance_idx ON stock_movements(balance_id)`,
    `CREATE TABLE IF NOT EXISTS mutation_queue (
      id TEXT PRIMARY KEY NOT NULL,
      idempotency_key TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      base_version INTEGER NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt_at INTEGER,
      last_error TEXT,
      created_at INTEGER NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS mutation_idempotency_idx ON mutation_queue(idempotency_key)`,
    `CREATE INDEX IF NOT EXISTS mutation_status_created_idx ON mutation_queue(status, created_at)`,
    `CREATE TABLE IF NOT EXISTS sync_state (
      entity TEXT PRIMARY KEY NOT NULL,
      last_pulled_at INTEGER,
      cursor TEXT,
      last_full_sync_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS conflicts (
      queue_item_id TEXT PRIMARY KEY NOT NULL,
      local_payload TEXT NOT NULL,
      server_state TEXT NOT NULL,
      detected_at INTEGER NOT NULL,
      resolution TEXT
    )`,
  ],
  // Example additive migration — MUST NOT touch mutation_queue structure destructively.
  2: [
    `ALTER TABLE stock_balances ADD COLUMN low_stock_threshold REAL`,
  ],
};

async function currentVersion(db: DB): Promise<number> {
  try {
    const rows = await db.execute(
      'SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations',
    );
    const row = rows.rows[0] as { version?: number } | undefined;
    return Number(row?.version ?? 0);
  } catch {
    return 0;
  }
}

export async function runMigrations(db: DB, target = SCHEMA_VERSION): Promise<void> {
  await db.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    applied_at INTEGER NOT NULL
  )`);

  let version = await currentVersion(db);

  while (version < target) {
    const next = version + 1;
    const statements = MIGRATIONS[next];
    if (!statements) {
      throw new Error(`Missing migration for version ${next}`);
    }
    logger.info('Applying DB migration', { version: next });
    for (const statement of statements) {
      await db.execute(statement);
    }
    await db.execute('INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      next,
      Date.now(),
    ]);
    version = next;
  }
}

/** Test-only: run up to an explicit version (e.g. seed at v1 then migrate to v2). */
export async function migrateTo(db: DB, version: number): Promise<void> {
  await runMigrations(db, version);
}

export { MIGRATIONS };

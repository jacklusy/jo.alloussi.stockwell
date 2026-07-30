import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

/** Mirrored reference + inventory tables + client-only sync tables. */

export const warehouses = sqliteTable('warehouses', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const locations = sqliteTable(
  'locations',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    warehouseId: text('warehouse_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('locations_warehouse_idx').on(t.warehouseId)],
);

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [uniqueIndex('products_tenant_sku_idx').on(t.tenantId, t.sku)],
);

export const stockBalances = sqliteTable(
  'stock_balances',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    warehouseId: text('warehouse_id').notNull(),
    locationId: text('location_id').notNull(),
    productId: text('product_id').notNull(),
    onHand: real('on_hand').notNull(),
    reserved: real('reserved').notNull(),
    version: integer('version').notNull(),
    pendingSync: integer('pending_sync', { mode: 'boolean' }).notNull().default(false),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('balances_warehouse_idx').on(t.warehouseId),
    index('balances_product_idx').on(t.productId),
    index('balances_location_idx').on(t.locationId),
  ],
);

export const stockMovements = sqliteTable(
  'stock_movements',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    balanceId: text('balance_id').notNull(),
    type: text('type').notNull(),
    quantity: real('quantity').notNull(),
    reason: text('reason'),
    note: text('note'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('movements_balance_idx').on(t.balanceId)],
);

/**
 * Client-only. MUST survive every migration — never drop/recreate.
 */
export const mutationQueue = sqliteTable(
  'mutation_queue',
  {
    id: text('id').primaryKey(),
    idempotencyKey: text('idempotency_key').notNull(),
    type: text('type').notNull(),
    payload: text('payload').notNull(),
    entityId: text('entity_id').notNull(),
    baseVersion: integer('base_version').notNull(),
    status: text('status').notNull(),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: integer('next_attempt_at'),
    lastError: text('last_error'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('mutation_idempotency_idx').on(t.idempotencyKey),
    index('mutation_status_created_idx').on(t.status, t.createdAt),
  ],
);

export const syncState = sqliteTable('sync_state', {
  entity: text('entity').primaryKey(),
  lastPulledAt: integer('last_pulled_at'),
  cursor: text('cursor'),
  lastFullSyncAt: integer('last_full_sync_at'),
});

export const conflicts = sqliteTable('conflicts', {
  queueItemId: text('queue_item_id').primaryKey(),
  localPayload: text('local_payload').notNull(),
  serverState: text('server_state').notNull(),
  detectedAt: integer('detected_at').notNull(),
  resolution: text('resolution'),
});

export const schema = {
  warehouses,
  locations,
  products,
  stockBalances,
  stockMovements,
  mutationQueue,
  syncState,
  conflicts,
};

/** Marker used by migration tests — do not remove. */
export const SCHEMA_VERSION = 1;

export const ensureQueueSql = sql`SELECT COUNT(*) AS c FROM mutation_queue`;

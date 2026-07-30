import { open, type DB } from '@op-engineering/op-sqlite';
import { drizzle, type OPSQLiteDatabase } from 'drizzle-orm/op-sqlite';

import { schema } from '@/storage/db/schema';
import { runMigrations } from '@/storage/db/migrations';

export type AppDatabase = OPSQLiteDatabase<typeof schema>;

let db: AppDatabase | null = null;
let raw: DB | null = null;

export async function initDatabase(): Promise<AppDatabase> {
  if (db) {
    return db;
  }

  raw = open({ name: 'stockwell.db' });
  db = drizzle(raw, { schema });
  await runMigrations(raw);
  return db;
}

export function getDatabase(): AppDatabase {
  if (!db) {
    throw new Error('Database not initialised — call initDatabase() during bootstrap');
  }
  return db;
}

export function getRawDatabase(): DB {
  if (!raw) {
    throw new Error('Database not initialised');
  }
  return raw;
}

/** Test helper — inject an in-memory / already-opened DB. */
export function setDatabaseForTests(database: AppDatabase, rawDb: DB): void {
  db = database;
  raw = rawDb;
}

export async function closeDatabase(): Promise<void> {
  if (raw) {
    raw.close();
  }
  raw = null;
  db = null;
}

import type { DB } from '@op-engineering/op-sqlite';

import { Result } from '@/core/domain';
import { ServerError, type AppError } from '@/core/errors';
import { clearTokens } from '@/storage/secure/keychain';
import { kvStorage } from '@/storage/kv/mmkv';
import { useSessionStore } from '@/services/auth/session-store';
import { useSyncStatusStore } from '@/services/auth/sync-status-store';
import { logger } from '@/services/logging/logger';

const MIRRORED_TABLES = [
  'stock_movements',
  'stock_balances',
  'locations',
  'products',
  'warehouses',
  'conflicts',
  'sync_state',
] as const;

/**
 * Logout wipe per doc 15 §10.
 * Queue is wiped only after explicit confirmation (caller responsibility).
 */
export async function wipeLocalTenantData(
  db: DB,
  options: { wipeQueue: boolean },
): Promise<Result<void, AppError>> {
  try {
    for (const table of MIRRORED_TABLES) {
      await db.execute(`DELETE FROM ${table}`);
    }
    if (options.wipeQueue) {
      await db.execute(`DELETE FROM mutation_queue`);
    }
    await clearTokens();
    kvStorage.remove('session.warehouseId');
    kvStorage.remove('auth.biometricEnabled');
    useSessionStore.getState().clear();
    useSyncStatusStore.getState().setStatus({ kind: 'synced' });
    logger.info('Local tenant data wiped', { wipeQueue: options.wipeQueue });
    return Result.ok(undefined);
  } catch (error) {
    logger.error('Wipe failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return Result.err(new ServerError(error instanceof Error ? error.message : 'Wipe failed'));
  }
}

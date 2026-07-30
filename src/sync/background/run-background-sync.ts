import type { SyncEngine } from '@/sync/engine/sync-engine';
import { logger } from '@/services/logging/logger';

/**
 * Single background sync entry used by Headless JS (Android) and future BGTask (iOS).
 * Best-effort — Doze / BGTask quotas may skip runs (ADR-M008).
 */
export async function runBackgroundSync(engine: SyncEngine): Promise<void> {
  try {
    await engine.boot();
    await engine.run('background');
  } catch (error) {
    logger.error('Background sync failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    throw error;
  }
}

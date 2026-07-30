import { AppRegistry, Platform } from 'react-native';

import { container, TOKENS } from '@/core/di';
import type { SyncEngine } from '@/sync/engine/sync-engine';
import { runBackgroundSync } from '@/sync/background/run-background-sync';
import { logger } from '@/services/logging/logger';

/** Must match Android HeadlessJsTaskService task name. */
export const BACKGROUND_SYNC_TASK = 'StockwellBackgroundSync';

let registered = false;

/** Test-only — clears the once-guard so Android registration can be asserted again. */
export function resetBackgroundSyncRegistrationForTests(): void {
  registered = false;
}

/**
 * Registers the Android Headless JS task. No-op on iOS (BGTaskScheduler deferred).
 * Safe to call multiple times.
 */
export function registerBackgroundSyncTask(): void {
  if (registered || Platform.OS !== 'android') {
    return;
  }
  registered = true;
  AppRegistry.registerHeadlessTask(BACKGROUND_SYNC_TASK, () => async () => {
    try {
      const engine = container.resolve<SyncEngine>(TOKENS.SYNC_ENGINE);
      await runBackgroundSync(engine);
    } catch (error) {
      logger.error('Headless background sync aborted', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  });
}

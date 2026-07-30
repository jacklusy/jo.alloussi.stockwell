import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';

import { networkAdapter } from '@/services/network/netinfo';
import type { SyncEngine } from '@/sync/engine/sync-engine';
import { logger } from '@/services/logging/logger';

const NETINFO_DEBOUNCE_MS = 2_000;
const FOREGROUND_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Sync triggers per doc 15 §5:
 * app foreground · connectivity regained (2s debounce) · every 5 min while foregrounded.
 * Manual refresh and after-enqueue are invoked by callers of engine.run().
 */
export function startSyncScheduler(engine: SyncEngine): () => void {
  let netTimer: ReturnType<typeof setTimeout> | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let appState: AppStateStatus = AppState.currentState;
  let wasOffline = false;

  const run = (reason: string) => {
    void engine.run(reason).catch((error: unknown) => {
      logger.error('Scheduled sync failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    });
  };

  const onAppState = (next: AppStateStatus) => {
    const wasBackground = appState.match(/inactive|background/);
    appState = next;
    if (wasBackground && next === 'active') {
      run('foreground');
      if (!intervalId) {
        intervalId = setInterval(() => run('interval-5m'), FOREGROUND_INTERVAL_MS);
      }
    }
    if (next.match(/inactive|background/) && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const appSub: NativeEventSubscription = AppState.addEventListener('change', onAppState);

  if (appState === 'active') {
    intervalId = setInterval(() => run('interval-5m'), FOREGROUND_INTERVAL_MS);
  }

  const unsubNet = networkAdapter.subscribe((status) => {
    const online = status.isConnected && status.isInternetReachable !== false;
    if (!online) {
      wasOffline = true;
      return;
    }
    if (!wasOffline) {
      return;
    }
    wasOffline = false;
    if (netTimer) {
      clearTimeout(netTimer);
    }
    netTimer = setTimeout(() => run('connectivity'), NETINFO_DEBOUNCE_MS);
  });

  void networkAdapter.getStatus().then((status) => {
    wasOffline = !(status.isConnected && status.isInternetReachable !== false);
  });

  return () => {
    appSub.remove();
    unsubNet();
    if (netTimer) {
      clearTimeout(netTimer);
    }
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}

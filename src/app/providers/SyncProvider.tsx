import React, { useEffect } from 'react';

import { container, TOKENS } from '@/core/di';
import type { SyncEngine } from '@/sync/engine/sync-engine';
import { startSyncScheduler } from '@/sync/engine/scheduler';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import { realtimeDeltaBuffer } from '@/sync/realtime/delta-buffer';
import { StockDeltaSocket } from '@/sync/realtime/stock-delta-socket';
import { registerBackgroundSyncTask } from '@/sync/background/register-background-sync';
import { OfflineBanner } from '@/ui/feedback/OfflineBanner';
import { useNetworkStore } from '@/hooks/useNetworkStore';
import { appConfig } from '@/services/api/config';
import { loadTokens } from '@/storage/secure/keychain';
import { getRawDatabase } from '@/storage/db/client';

export type SyncProviderProps = {
  children: React.ReactNode;
};

/**
 * Starts sync triggers, optional WebSocket deltas, and shows the offline banner.
 */
export function SyncProvider({ children }: SyncProviderProps): React.JSX.Element {
  const networkStatus = useNetworkStore((s) => s.status);
  const hydrate = useNetworkStore((s) => s.hydrate);
  const subscribe = useNetworkStore((s) => s.subscribe);

  useEffect(() => {
    void hydrate();
    return subscribe();
  }, [hydrate, subscribe]);

  useEffect(() => {
    registerBackgroundSyncTask();
  }, []);

  useEffect(() => {
    let stopScheduler: (() => void) | undefined;
    let socket: StockDeltaSocket | undefined;
    try {
      const engine = container.resolve<SyncEngine>(TOKENS.SYNC_ENGINE);
      void engine.boot().then(() => {
        stopScheduler = startSyncScheduler(engine);
        void engine.run('bootstrap');

        if (appConfig.wsUrl) {
          socket = new StockDeltaSocket({
            url: appConfig.wsUrl,
            db: getRawDatabase(),
            queue: new MutationQueue(getRawDatabase()),
            buffer: realtimeDeltaBuffer,
            getAccessToken: async () => (await loadTokens())?.accessToken ?? null,
            onReconnect: async () => {
              await engine.run('ws-reconnect');
            },
          });
          socket.start();
        }
      });
    } catch {
      // Engine not registered yet (e.g. early boot / tests)
    }
    return () => {
      stopScheduler?.();
      socket?.stop();
    };
  }, []);

  const isOffline = !networkStatus.isConnected || networkStatus.isInternetReachable === false;

  return (
    <>
      <OfflineBanner visible={isOffline} />
      {children}
    </>
  );
}

import React, { useEffect } from 'react';

import { container, TOKENS } from '@/core/di';
import type { SyncEngine } from '@/sync/engine/sync-engine';
import { startSyncScheduler } from '@/sync/engine/scheduler';
import { OfflineBanner } from '@/ui/feedback/OfflineBanner';
import { useNetworkStore } from '@/hooks/useNetworkStore';

export type SyncProviderProps = {
  children: React.ReactNode;
};

/**
 * Starts sync triggers and shows the global offline banner.
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
    let stop: (() => void) | undefined;
    try {
      const engine = container.resolve<SyncEngine>(TOKENS.SYNC_ENGINE);
      void engine.boot().then(() => {
        stop = startSyncScheduler(engine);
        void engine.run('bootstrap');
      });
    } catch {
      // Engine not registered yet (e.g. early boot / tests)
    }
    return () => {
      stop?.();
    };
  }, []);

  const isOffline =
    !networkStatus.isConnected || networkStatus.isInternetReachable === false;

  return (
    <>
      <OfflineBanner visible={isOffline} />
      {children}
    </>
  );
}

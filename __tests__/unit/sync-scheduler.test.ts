import { AppState } from 'react-native';

import { startSyncScheduler } from '@/sync/engine/scheduler';
import type { SyncEngine } from '@/sync/engine/sync-engine';
import { networkAdapter } from '@/services/network/netinfo';

jest.mock('@/services/network/netinfo', () => ({
  networkAdapter: {
    isOnline: jest.fn(async () => true),
    getStatus: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
    subscribe: jest.fn(),
  },
}));

type NetStatus = { isConnected: boolean; isInternetReachable: boolean };

describe('startSyncScheduler', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('runs on connectivity regained after debounce and cleans up', () => {
    jest.useFakeTimers();
    const run = jest.fn(async () => undefined);
    const engine = { run } as unknown as SyncEngine;

    let netListener: ((s: NetStatus) => void) | undefined;
    (networkAdapter.subscribe as jest.Mock).mockImplementation((cb: (s: NetStatus) => void) => {
      netListener = cb;
      return jest.fn();
    });

    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove } as never);

    const stop = startSyncScheduler(engine);

    expect(netListener).toBeDefined();
    netListener?.({ isConnected: false, isInternetReachable: false });
    netListener?.({ isConnected: true, isInternetReachable: true });
    jest.advanceTimersByTime(2_000);
    expect(run).toHaveBeenCalledWith('connectivity');

    stop();
    expect(remove).toHaveBeenCalled();
  });

  it('runs on foreground transition and clears interval in background', () => {
    jest.useFakeTimers();
    const run = jest.fn(async () => undefined);
    const engine = { run } as unknown as SyncEngine;
    (networkAdapter.subscribe as jest.Mock).mockReturnValue(jest.fn());

    let appListener: ((state: string) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_e, cb) => {
      appListener = cb as (state: string) => void;
      return { remove: jest.fn() } as never;
    });
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'background' });

    const stop = startSyncScheduler(engine);
    appListener?.('active');
    expect(run).toHaveBeenCalledWith('foreground');
    appListener?.('background');
    stop();
  });
});

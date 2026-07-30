import { create } from 'zustand';

import type { NetworkStatus } from '@/services/network/netinfo';
import { networkAdapter } from '@/services/network/netinfo';

type NetworkSlice = {
  status: NetworkStatus;
  hydrate: () => Promise<void>;
  subscribe: () => () => void;
};

export const useNetworkStore = create<NetworkSlice>((set) => ({
  status: { isConnected: true, isInternetReachable: true },
  hydrate: async () => {
    const status = await networkAdapter.getStatus();
    set({ status });
  },
  subscribe: () =>
    networkAdapter.subscribe((status) => {
      set({ status });
    }),
}));

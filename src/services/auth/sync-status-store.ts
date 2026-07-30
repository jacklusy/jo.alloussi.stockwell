import { create } from 'zustand';

import type { SyncStatus } from '@/ui/feedback/SyncStatusIndicator';

type SyncStatusSlice = {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
};

export const useSyncStatusStore = create<SyncStatusSlice>((set) => ({
  status: { kind: 'synced' },
  setStatus: (status) => set({ status }),
}));

import { create } from 'zustand';

import type { TenantId, UserId, WarehouseId } from '@/types/ids';

export type SessionUser = {
  id: UserId;
  email: string;
  displayName: string;
  role: string;
};

export type SessionState = {
  user: SessionUser | null;
  tenantId: TenantId | null;
  warehouseId: WarehouseId | null;
  isHydrated: boolean;
  biometricEnabled: boolean;
  setSession: (input: {
    user: SessionUser;
    tenantId: TenantId;
    warehouseId?: WarehouseId | null;
  }) => void;
  setWarehouseId: (warehouseId: WarehouseId) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  tenantId: null,
  warehouseId: null,
  isHydrated: false,
  biometricEnabled: false,
  setSession: ({ user, tenantId, warehouseId = null }) =>
    set({
      user,
      tenantId,
      warehouseId,
    }),
  setWarehouseId: (warehouseId) => set({ warehouseId }),
  setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
  setHydrated: (isHydrated) => set({ isHydrated }),
  clear: () =>
    set({
      user: null,
      tenantId: null,
      warehouseId: null,
      biometricEnabled: false,
    }),
}));

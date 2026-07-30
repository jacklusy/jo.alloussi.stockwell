import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Routes } from './routes';

export type AuthStackParamList = {
  [Routes.Login]: undefined;
};

export type InventoryStackParamList = {
  [Routes.InventoryList]: undefined;
  [Routes.BalanceDetail]: { balanceId: string };
  [Routes.AdjustStock]: { balanceId: string };
};

export type TabsParamList = {
  [Routes.InventoryTab]: NavigatorScreenParams<InventoryStackParamList>;
  [Routes.SyncCentre]: undefined;
  [Routes.Settings]: undefined;
};

export type MainStackParamList = {
  [Routes.WarehouseSelect]: undefined;
  [Routes.Tabs]: NavigatorScreenParams<TabsParamList>;
  [Routes.Modals]: NavigatorScreenParams<ModalStackParamList>;
  [Routes.ComponentGallery]: undefined;
};

export type ModalStackParamList = {
  [Routes.Scanner]: undefined;
  [Routes.ConflictResolution]: { queueItemId: string };
  [Routes.PermissionDenied]: { permission: 'camera' | 'biometrics' };
};

export type RootStackParamList = {
  [Routes.Bootstrap]: undefined;
  [Routes.Auth]: NavigatorScreenParams<AuthStackParamList>;
  [Routes.Main]: NavigatorScreenParams<MainStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

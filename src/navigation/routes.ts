export const Routes = {
  Bootstrap: 'Bootstrap',
  Auth: 'Auth',
  Login: 'Login',
  Main: 'Main',
  WarehouseSelect: 'WarehouseSelect',
  Tabs: 'Tabs',
  InventoryTab: 'InventoryTab',
  InventoryList: 'InventoryList',
  BalanceDetail: 'BalanceDetail',
  AdjustStock: 'AdjustStock',
  SyncCentre: 'SyncCentre',
  Settings: 'Settings',
  Modals: 'Modals',
  Scanner: 'Scanner',
  ConflictResolution: 'ConflictResolution',
  PermissionDenied: 'PermissionDenied',
  ComponentGallery: 'ComponentGallery',
} as const;

export type RouteName = (typeof Routes)[keyof typeof Routes];

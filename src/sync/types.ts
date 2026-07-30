export type SyncEntity =
  | 'warehouses'
  | 'locations'
  | 'products'
  | 'stock_balances'
  | 'stock_movements';

export type SyncEngineState =
  | 'IDLE'
  | 'PULLING'
  | 'PUSHING'
  | 'RESOLVING'
  | 'ERROR'
  | 'OFFLINE';

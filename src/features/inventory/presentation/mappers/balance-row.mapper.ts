import type { StockBalance } from '@/features/inventory/domain/entities/stock-balance';
import { availableQuantity } from '@/features/inventory/domain/entities/stock-balance';

export type BalanceRowViewModel = {
  id: string;
  title: string;
  subtitle: string;
  quantityLabel: string;
  pendingSync: boolean;
  accessibilityLabel: string;
};

export function mapBalanceToRowViewModel(balance: StockBalance): BalanceRowViewModel {
  const available = availableQuantity(balance);
  const quantityLabel = String(available);
  return {
    id: balance.id,
    title: balance.productName,
    subtitle: `${balance.sku} · ${balance.locationCode}`,
    quantityLabel,
    pendingSync: balance.pendingSync,
    accessibilityLabel: `${balance.productName}, ${quantityLabel} available${
      balance.pendingSync ? ', pending sync' : ''
    }`,
  };
}

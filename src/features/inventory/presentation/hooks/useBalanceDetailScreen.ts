import { useEffect, useState } from 'react';

import { container, TOKENS } from '@/core/di';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import { availableQuantity } from '@/features/inventory/domain/entities/stock-balance';
import { asBalanceId } from '@/types/ids';
import { t } from '@/i18n';

export type BalanceDetailViewState = {
  isLoading: boolean;
  errorMessage: string | null;
  sku: string;
  productName: string;
  locationCode: string;
  onHandLabel: string;
  availableLabel: string;
  pendingSync: boolean;
  accessibilityQuantity: string;
  refresh: () => void;
};

export function useBalanceDetailScreen(balanceId: string): BalanceDetailViewState {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [locationCode, setLocationCode] = useState('');
  const [onHand, setOnHand] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [pendingSync, setPendingSync] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    const repo = container.resolve<StockBalanceRepository>(TOKENS.STOCK_BALANCE_REPOSITORY);
    void repo.getById(asBalanceId(balanceId)).then((result) => {
      if (cancelled) {
        return;
      }
      setIsLoading(false);
      if (!result.ok) {
        setErrorMessage(result.error.userMessage);
        return;
      }
      if (!result.value) {
        setErrorMessage(t('inventory.detailMissing'));
        return;
      }
      const balance = result.value;
      setSku(balance.sku);
      setProductName(balance.productName);
      setLocationCode(balance.locationCode);
      setOnHand(balance.onHand);
      setAvailable(availableQuantity(balance));
      setPendingSync(balance.pendingSync);
    });
    return () => {
      cancelled = true;
    };
  }, [balanceId, tick]);

  return {
    isLoading,
    errorMessage,
    sku,
    productName,
    locationCode,
    onHandLabel: onHand === null ? '—' : String(onHand),
    availableLabel: available === null ? '—' : String(available),
    pendingSync,
    accessibilityQuantity:
      onHand === null ? t('inventory.detailLoading') : `${t('inventory.onHand')}: ${onHand}`,
    refresh: () => setTick((n) => n + 1),
  };
}

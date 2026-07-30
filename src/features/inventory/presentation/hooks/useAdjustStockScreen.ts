import { useCallback, useEffect, useRef, useState } from 'react';

import { container, TOKENS } from '@/core/di';
import type { AdjustStockUseCase } from '@/features/inventory/application/use-cases/adjust-stock.usecase';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import { asBalanceId } from '@/types/ids';
import { t } from '@/i18n';

export type AdjustStockViewState = {
  sku: string;
  productName: string;
  onHandLabel: string;
  delta: number;
  setDelta: (value: number) => void;
  reason: string;
  setReason: (value: string) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  confirm: () => void;
  resultingOnHand: number | null;
};

export type AdjustStockScreenOptions = {
  onSuccess?: (message: string) => void;
};

export function useAdjustStockScreen(
  balanceId: string,
  options?: AdjustStockScreenOptions,
): AdjustStockViewState {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('correction');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [onHand, setOnHand] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const onSuccessRef = useRef(options?.onSuccess);
  onSuccessRef.current = options?.onSuccess;

  useEffect(() => {
    let cancelled = false;
    const repo = container.resolve<StockBalanceRepository>(TOKENS.STOCK_BALANCE_REPOSITORY);
    void repo.getById(asBalanceId(balanceId)).then((result) => {
      if (cancelled || !result.ok || !result.value) {
        return;
      }
      setSku(result.value.sku);
      setProductName(result.value.productName);
      setOnHand(result.value.onHand);
    });
    return () => {
      cancelled = true;
    };
  }, [balanceId]);

  const confirm = useCallback(() => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const useCase = container.resolve<AdjustStockUseCase>(TOKENS.ADJUST_STOCK_USE_CASE);
    void useCase
      .execute({
        balanceId: asBalanceId(balanceId),
        delta,
        reason,
      })
      .then((result) => {
        setIsSubmitting(false);
        if (!result.ok) {
          setErrorMessage(result.error.userMessage);
          return;
        }
        setOnHand(result.value.onHand);
        const message = t('inventory.adjustSaved');
        setSuccessMessage(message);
        setDelta(0);
        onSuccessRef.current?.(message);
      });
  }, [balanceId, delta, reason]);

  return {
    sku,
    productName,
    onHandLabel: onHand === null ? '—' : String(onHand),
    delta,
    setDelta,
    reason,
    setReason,
    isSubmitting,
    errorMessage,
    successMessage,
    confirm,
    resultingOnHand: onHand === null ? null : onHand + delta,
  };
}

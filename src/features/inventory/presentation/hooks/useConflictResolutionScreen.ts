import { useCallback, useEffect, useState } from 'react';

import { container, TOKENS } from '@/core/di';
import type {
  ConflictResolutionAction,
  ResolveConflictUseCase,
} from '@/features/inventory/application/use-cases/resolve-conflict.usecase';
import type { GetConflictDetailUseCase } from '@/features/inventory/application/use-cases/get-conflict-detail.usecase';

export type ConflictResolutionViewState = {
  localSummary: string;
  serverSummary: string;
  manualOnHand: string;
  setManualOnHand: (value: string) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  retryOnNewBase: () => void;
  discardLocal: () => void;
  applyManual: () => void;
};

export function useConflictResolutionScreen(
  queueItemId: string,
  onResolved: () => void,
): ConflictResolutionViewState {
  const [localSummary, setLocalSummary] = useState('');
  const [serverSummary, setServerSummary] = useState('');
  const [manualOnHand, setManualOnHand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const useCase = container.resolve<GetConflictDetailUseCase>(
      TOKENS.GET_CONFLICT_DETAIL_USE_CASE,
    );
    void useCase.execute(queueItemId).then((result) => {
      if (cancelled || !result.ok) {
        return;
      }
      setLocalSummary(result.value.localSummary);
      setServerSummary(result.value.serverSummary);
      if (result.value.serverOnHand !== null) {
        setManualOnHand(String(result.value.serverOnHand));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [queueItemId]);

  const run = useCallback(
    (action: ConflictResolutionAction) => {
      setIsSubmitting(true);
      setErrorMessage(null);
      const useCase = container.resolve<ResolveConflictUseCase>(TOKENS.RESOLVE_CONFLICT_USE_CASE);
      void useCase.execute(queueItemId, action).then((result) => {
        setIsSubmitting(false);
        if (!result.ok) {
          setErrorMessage(result.error.userMessage);
          return;
        }
        onResolved();
      });
    },
    [onResolved, queueItemId],
  );

  return {
    localSummary,
    serverSummary,
    manualOnHand,
    setManualOnHand,
    isSubmitting,
    errorMessage,
    retryOnNewBase: () => run({ kind: 'retryOnNewBase' }),
    discardLocal: () => run({ kind: 'discardLocal' }),
    applyManual: () => {
      const onHand = Number(manualOnHand);
      run({ kind: 'setManualQuantity', onHand });
    },
  };
}

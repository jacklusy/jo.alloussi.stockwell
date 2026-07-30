import { useCallback, useEffect, useState } from 'react';

import { container, TOKENS } from '@/core/di';
import type {
  SyncCentreItem,
  SyncCentreSection,
  SyncCentreUseCase,
} from '@/features/inventory/application/use-cases/sync-centre.usecase';
import { useSyncStatusStore } from '@/services/auth/sync-status-store';

export type SyncCentreSectionGroup = {
  section: SyncCentreSection;
  items: SyncCentreItem[];
};

export type SyncCentreViewState = {
  groups: SyncCentreSectionGroup[];
  isEmpty: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => void;
  retry: (id: string) => void;
  discard: (id: string) => void;
  openConflict: (id: string) => void;
};

const SECTION_ORDER: SyncCentreSection[] = ['CONFLICT', 'PENDING', 'FAILED', 'DEAD'];

export function useSyncCentreScreen(
  onOpenConflict: (queueItemId: string) => void,
): SyncCentreViewState {
  const [items, setItems] = useState<SyncCentreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const syncStatus = useSyncStatusStore((s) => s.status);

  const refresh = useCallback(() => {
    setIsLoading(true);
    const useCase = container.resolve<SyncCentreUseCase>(TOKENS.SYNC_CENTRE_USE_CASE);
    void useCase.list().then((list) => {
      setItems(list);
      setIsLoading(false);
      setErrorMessage(null);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, syncStatus]);

  const retry = useCallback(
    (id: string) => {
      const useCase = container.resolve<SyncCentreUseCase>(TOKENS.SYNC_CENTRE_USE_CASE);
      void useCase.retry(id).then((result) => {
        if (!result.ok) {
          setErrorMessage(result.error.userMessage);
          return;
        }
        refresh();
      });
    },
    [refresh],
  );

  const discard = useCallback(
    (id: string) => {
      const useCase = container.resolve<SyncCentreUseCase>(TOKENS.SYNC_CENTRE_USE_CASE);
      void useCase.discard(id).then((result) => {
        if (!result.ok) {
          setErrorMessage(result.error.userMessage);
          return;
        }
        refresh();
      });
    },
    [refresh],
  );

  const groups: SyncCentreSectionGroup[] = SECTION_ORDER.map((section) => ({
    section,
    items: items.filter((item) => item.section === section),
  })).filter((group) => group.items.length > 0);

  return {
    groups,
    isEmpty: items.length === 0,
    isLoading,
    errorMessage,
    refresh,
    retry,
    discard,
    openConflict: onOpenConflict,
  };
}

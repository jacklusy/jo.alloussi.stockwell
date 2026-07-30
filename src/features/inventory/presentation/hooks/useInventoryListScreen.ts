import { useCallback, useEffect, useState } from 'react';

import { container, TOKENS } from '@/core/di';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import {
  mapBalanceToRowViewModel,
  type BalanceRowViewModel,
} from '@/features/inventory/presentation/mappers/balance-row.mapper';
import { useSessionStore } from '@/services/auth/session-store';
import { useNetworkStore } from '@/hooks/useNetworkStore';
import type { WarehouseId } from '@/types/ids';

const PAGE_SIZE = 50;

export type InventoryListViewState = {
  items: BalanceRowViewModel[];
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  errorMessage: string | null;
  search: string;
  setSearch: (value: string) => void;
  loadMore: () => void;
  refresh: () => void;
  hasMore: boolean;
};

export function useInventoryListScreen(): InventoryListViewState {
  const warehouseId = useSessionStore((s) => s.warehouseId);
  const networkStatus = useNetworkStore((s) => s.status);
  const hydrateNetwork = useNetworkStore((s) => s.hydrate);
  const subscribeNetwork = useNetworkStore((s) => s.subscribe);
  const [items, setItems] = useState<BalanceRowViewModel[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    void hydrateNetwork();
    return subscribeNetwork();
  }, [hydrateNetwork, subscribeNetwork]);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      if (!warehouseId) {
        setItems([]);
        setIsLoading(false);
        return;
      }
      const repo = container.resolve<StockBalanceRepository>(TOKENS.STOCK_BALANCE_REPOSITORY);
      const result = await repo.list({
        warehouseId: warehouseId as WarehouseId,
        search: debouncedSearch,
        page: pageToLoad,
        limit: PAGE_SIZE,
      });
      if (!result.ok) {
        setErrorMessage(result.error.userMessage);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      const mapped = result.value.items.map(mapBalanceToRowViewModel);
      setTotal(result.value.total);
      setItems((prev) => (replace ? mapped : [...prev, ...mapped]));
      setPage(pageToLoad);
      setErrorMessage(null);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [debouncedSearch, warehouseId],
  );

  useEffect(() => {
    setIsLoading(true);
    void fetchPage(1, true);
  }, [fetchPage]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
  }, []);

  const loadMore = useCallback(() => {
    if (items.length >= total || isLoading) {
      return;
    }
    void fetchPage(page + 1, false);
  }, [fetchPage, isLoading, items.length, page, total]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchPage(1, true);
    try {
      const engine = container.resolve<{ run: (reason?: string) => Promise<void> }>(
        TOKENS.SYNC_ENGINE,
      );
      void engine.run('pull-to-refresh');
    } catch {
      // Engine may be unavailable in isolated tests
    }
  }, [fetchPage]);

  const isOffline =
    !networkStatus.isConnected || networkStatus.isInternetReachable === false;

  return {
    items,
    isLoading,
    isRefreshing,
    isOffline,
    errorMessage,
    search,
    setSearch,
    loadMore,
    refresh,
    hasMore: items.length < total,
  };
}

import React, { useCallback, useEffect, useState } from 'react';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { ListRow } from '@/ui/components/ListRow';
import { StateView } from '@/ui/feedback/StateView';
import { InventoryListSkeleton } from '@/features/inventory/presentation/components/InventoryListSkeleton';
import { container, TOKENS } from '@/core/di';
import type { WarehouseRepository } from '@/features/warehouses/domain/warehouse.repository';
import type { Warehouse } from '@/features/warehouses/domain/warehouse.repository';
import { useSessionStore } from '@/services/auth/session-store';
import { persistWarehouseId } from '@/features/auth/application/use-cases/login.usecase';
import { t } from '@/i18n';

export function WarehouseSelectScreen(): React.JSX.Element {
  const setWarehouseId = useSessionStore((s) => s.setWarehouseId);
  const [items, setItems] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const repo = container.resolve<WarehouseRepository>(TOKENS.WAREHOUSE_REPOSITORY);
      const result = await repo.list();
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error.userMessage);
        setLoading(false);
        return;
      }
      setItems(result.value);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const onSelect = useCallback(
    (warehouse: Warehouse) => {
      setWarehouseId(warehouse.id);
      persistWarehouseId(warehouse.id);
    },
    [setWarehouseId],
  );

  return (
    <Box flex={1} background="background" padding={4} gap={3}>
      <Text variant="h1">{t('warehouse.title')}</Text>
      <Text variant="body" color="secondary">
        {t('warehouse.subtitle')}
      </Text>
      {loading ? (
        <InventoryListSkeleton count={4} />
      ) : error ? (
        <StateView
          kind="error"
          headline={t('warehouse.errorHeadline')}
          body={error}
          actionLabel={t('warehouse.retry')}
          onAction={() => setReloadKey((n) => n + 1)}
        />
      ) : items.length === 0 ? (
        <StateView
          kind="empty"
          headline={t('warehouse.emptyHeadline')}
          body={t('warehouse.emptyBody')}
        />
      ) : (
        items.map((warehouse) => (
          <ListRow
            key={warehouse.id}
            title={warehouse.name}
            subtitle={warehouse.code}
            chevron
            onPress={() => onSelect(warehouse)}
          />
        ))
      )}
    </Box>
  );
}

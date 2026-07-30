import React, { useCallback, useEffect, useState } from 'react';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { ListRow } from '@/ui/components/ListRow';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { StateView } from '@/ui/feedback/StateView';
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

  useEffect(() => {
    let cancelled = false;
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
  }, []);

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
        <Box gap={2}>
          <Skeleton width="100%" height={56} />
          <Skeleton width="100%" height={56} />
        </Box>
      ) : error ? (
        <StateView kind="error" headline="Could not load warehouses" body={error} />
      ) : items.length === 0 ? (
        <StateView
          kind="empty"
          headline="No warehouses assigned"
          body="Contact your manager to get warehouse access."
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

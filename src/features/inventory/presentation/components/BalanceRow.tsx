import React, { memo } from 'react';

import { ListRow } from '@/ui/components/ListRow';
import { Text } from '@/ui/primitives/Text';
import { Badge } from '@/ui/components/Badge';
import { useTheme } from '@/ui/theme';
import type { BalanceRowViewModel } from '@/features/inventory/presentation/mappers/balance-row.mapper';

export type BalanceRowProps = {
  item: BalanceRowViewModel;
  onPress: (id: string) => void;
};

function BalanceRowComponent({ item, onPress }: BalanceRowProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <ListRow
      title={item.title}
      subtitle={item.subtitle}
      syncRailColor={
        item.pendingSync ? theme.colors.sync.pending : theme.colors.sync.synced
      }
      accessibilityLabel={item.accessibilityLabel}
      chevron
      onPress={() => onPress(item.id)}
      trailing={
        <>
          <Text variant="numericSm">{item.quantityLabel}</Text>
          {item.pendingSync ? (
            <Badge label="Pending" variant="sync-pending" icon="●" />
          ) : null}
        </>
      }
    />
  );
}

export const BalanceRow = memo(BalanceRowComponent);

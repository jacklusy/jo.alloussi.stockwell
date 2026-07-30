import React, { memo } from 'react';

import { ListRow } from '@/ui/components/ListRow';
import { Text } from '@/ui/primitives/Text';
import { Badge } from '@/ui/components/Badge';
import { Icon } from '@/ui/icons/Icon';
import { useTheme } from '@/ui/theme';
import type { BalanceRowViewModel } from '@/features/inventory/presentation/mappers/balance-row.mapper';
import { t } from '@/i18n';

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
      syncRailColor={item.pendingSync ? theme.colors.sync.pending : theme.colors.sync.synced}
      accessibilityLabel={item.accessibilityLabel}
      chevron
      onPress={() => onPress(item.id)}
      trailing={
        <>
          <Text variant="numericSm">{item.quantityLabel}</Text>
          {item.pendingSync ? (
            <Badge
              label={t('inventory.pendingBadge')}
              variant="sync-pending"
              icon={<Icon name="pending" size={12} color={theme.colors.sync.pending} />}
            />
          ) : null}
        </>
      }
    />
  );
}

export const BalanceRow = memo(BalanceRowComponent);

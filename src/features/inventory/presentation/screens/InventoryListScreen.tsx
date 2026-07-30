import React from 'react';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { SearchBar } from '@/ui/components/SearchBar';
import { ListRow } from '@/ui/components/ListRow';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useTheme } from '@/ui/theme';
import { t } from '@/i18n';

export function InventoryListScreen(): React.JSX.Element {
  const theme = useTheme();
  return (
    <Box flex={1} background="background" padding={4} gap={3}>
      <Text variant="h1">{t('inventory.title')}</Text>
      <SearchBar value="" onChangeText={() => undefined} placeholder={t('inventory.search')} />
      <ListRow
        title="Sample SKU"
        subtitle="Bin A-01"
        syncRailColor={theme.colors.sync.synced}
        chevron
        trailing={
          <Text variant="numericSm" color="primary">
            120
          </Text>
        }
        onPress={() => undefined}
      />
      <Skeleton width="100%" height={56} />
    </Box>
  );
}

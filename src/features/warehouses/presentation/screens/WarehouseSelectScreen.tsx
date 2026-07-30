import React from 'react';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { ListRow } from '@/ui/components/ListRow';
import { t } from '@/i18n';

export function WarehouseSelectScreen(): React.JSX.Element {
  return (
    <Box flex={1} background="background" padding={4} gap={3}>
      <Text variant="h1">{t('warehouse.title')}</Text>
      <Text variant="body" color="secondary">
        {t('warehouse.subtitle')}
      </Text>
      <ListRow title="Demo Warehouse" subtitle="WH-001" chevron onPress={() => undefined} />
    </Box>
  );
}

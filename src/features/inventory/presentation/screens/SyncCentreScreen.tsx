import React from 'react';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { StateView } from '@/ui/feedback/StateView';
import { t } from '@/i18n';

export function SyncCentreScreen(): React.JSX.Element {
  return (
    <Box flex={1} background="background">
      <Box padding={4}>
        <Text variant="h1">{t('sync.title')}</Text>
      </Box>
      <StateView
        kind="empty"
        headline={t('sync.emptyHeadline')}
        body={t('sync.emptyBody')}
      />
    </Box>
  );
}

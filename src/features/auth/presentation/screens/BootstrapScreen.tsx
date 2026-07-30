import React from 'react';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { t } from '@/i18n';

export function BootstrapScreen(): React.JSX.Element {
  return (
    <Box flex={1} align="center" justify="center" background="background" padding={4}>
      <Text variant="h1">{t('app.name')}</Text>
      <Text variant="body" color="secondary">
        {t('bootstrap.loading')}
      </Text>
    </Box>
  );
}

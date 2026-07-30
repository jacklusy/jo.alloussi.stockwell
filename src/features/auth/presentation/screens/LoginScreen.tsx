import React from 'react';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Input } from '@/ui/components/Input';
import { Button } from '@/ui/components/Button';
import { t } from '@/i18n';

export function LoginScreen(): React.JSX.Element {
  return (
    <Box flex={1} background="background" padding={4} justify="center" gap={4}>
      <Text variant="display">{t('app.name')}</Text>
      <Text variant="body" color="secondary">
        {t('login.subtitle')}
      </Text>
      <Input label={t('login.email')} autoCapitalize="none" keyboardType="email-address" />
      <Input label={t('login.password')} secureTextEntry />
      <Button label={t('login.submit')} onPress={() => undefined} />
    </Box>
  );
}

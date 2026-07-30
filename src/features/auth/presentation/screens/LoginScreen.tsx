import React from 'react';
import { Controller } from 'react-hook-form';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Input } from '@/ui/components/Input';
import { Button } from '@/ui/components/Button';
import { useLoginScreen } from '@/features/auth/presentation/hooks/useLoginScreen';
import { t } from '@/i18n';

export function LoginScreen(): React.JSX.Element {
  const {
    form,
    submit,
    isSubmitting,
    errorMessage,
    isOffline,
    biometricAvailable,
    unlockWithBiometrics,
  } = useLoginScreen();

  return (
    <Box flex={1} background="background" padding={4} justify="center" gap={4}>
      <Text variant="display">{t('app.name')}</Text>
      <Text variant="body" color="secondary">
        {t('login.subtitle')}
      </Text>

      {isOffline ? (
        <Text variant="bodySm" color="warning" accessibilityLiveRegion="polite">
          {t('login.offline')}
        </Text>
      ) : null}

      {errorMessage ? (
        <Text variant="bodySm" color="danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}

      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <Input
            label={t('login.email')}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            editable={!isSubmitting && !isOffline}
            {...(fieldState.error?.message !== undefined
              ? { error: fieldState.error.message }
              : {})}
          />
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <Input
            label={t('login.password')}
            secureTextEntry
            autoComplete="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            editable={!isSubmitting && !isOffline}
            {...(fieldState.error?.message !== undefined
              ? { error: fieldState.error.message }
              : {})}
          />
        )}
      />

      <Button
        label={t('login.submit')}
        loading={isSubmitting}
        disabled={isOffline}
        onPress={form.handleSubmit((values) => {
          void submit(values);
        })}
      />

      {biometricAvailable ? (
        <Button
          label={t('login.biometric')}
          variant="secondary"
          disabled={isSubmitting}
          onPress={() => {
            void unlockWithBiometrics();
          }}
        />
      ) : null}
    </Box>
  );
}

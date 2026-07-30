import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ModalStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { useConflictResolutionScreen } from '@/features/inventory/presentation/hooks/useConflictResolutionScreen';
import { t } from '@/i18n';

export type ConflictResolutionScreenProps = NativeStackScreenProps<
  ModalStackParamList,
  typeof Routes.ConflictResolution
>;

export function ConflictResolutionScreen({
  route,
  navigation,
}: ConflictResolutionScreenProps): React.JSX.Element {
  const state = useConflictResolutionScreen(route.params.queueItemId, () => {
    navigation.goBack();
  });

  return (
    <Box flex={1} background="background" padding={4} gap={4}>
      <Text variant="h1">{t('sync.conflictTitle')}</Text>
      <Box gap={2}>
        <Text variant="overline" color="secondary">
          {t('sync.conflictLocal')}
        </Text>
        <Text variant="body">{state.localSummary || '—'}</Text>
      </Box>
      <Box gap={2}>
        <Text variant="overline" color="secondary">
          {t('sync.conflictServer')}
        </Text>
        <Text variant="body">{state.serverSummary || '—'}</Text>
      </Box>
      <Input
        label={t('sync.manualQuantity')}
        value={state.manualOnHand}
        onChangeText={state.setManualOnHand}
        keyboardType="number-pad"
      />
      {state.errorMessage ? (
        <Text variant="bodySm" color="danger">
          {state.errorMessage}
        </Text>
      ) : null}
      <Box gap={3}>
        <Button
          label={t('sync.retryOnNewBase')}
          onPress={state.retryOnNewBase}
          loading={state.isSubmitting}
        />
        <Button
          label={t('sync.discardMine')}
          variant="secondary"
          onPress={state.discardLocal}
          disabled={state.isSubmitting}
        />
        <Button
          label={t('sync.applyManual')}
          variant="ghost"
          onPress={state.applyManual}
          disabled={state.isSubmitting}
        />
      </Box>
    </Box>
  );
}

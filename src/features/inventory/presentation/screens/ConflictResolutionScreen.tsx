import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ModalStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { useConflictResolutionScreen } from '@/features/inventory/presentation/hooks/useConflictResolutionScreen';
import { Icon } from '@/ui/icons/Icon';
import { useTheme } from '@/ui/theme';
import { t } from '@/i18n';

export type ConflictResolutionScreenProps = NativeStackScreenProps<
  ModalStackParamList,
  typeof Routes.ConflictResolution
>;

export function ConflictResolutionScreen({
  route,
  navigation,
}: ConflictResolutionScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const state = useConflictResolutionScreen(route.params.queueItemId, () => {
    navigation.goBack();
  });

  return (
    <Box
      flex={1}
      background="background"
      padding={4}
      gap={4}
      style={{ paddingBottom: Math.max(insets.bottom, theme.space[4]) }}
    >
      <Box row align="center" gap={2}>
        <Icon name="conflict" size={22} color={theme.colors.sync.conflict} />
        <Text variant="h1">{t('sync.conflictTitle')}</Text>
      </Box>

      <Box
        padding={4}
        radius="md"
        background="surfaceRaised"
        border="subtle"
        gap={2}
        style={{ borderStartWidth: 4, borderStartColor: theme.colors.sync.pending }}
      >
        <Text variant="overline" color="secondary">
          {t('sync.conflictLocal')}
        </Text>
        <Text variant="body">{state.localSummary || '—'}</Text>
      </Box>

      <Box
        padding={4}
        radius="md"
        background="surfaceRaised"
        border="subtle"
        gap={2}
        style={{ borderStartWidth: 4, borderStartColor: theme.colors.sync.synced }}
      >
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
        <Text variant="bodySm" color="danger" accessibilityLiveRegion="polite">
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

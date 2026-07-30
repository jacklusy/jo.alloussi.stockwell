import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { InventoryStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { QuantityStepper } from '@/ui/components/QuantityStepper';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { useAdjustStockScreen } from '@/features/inventory/presentation/hooks/useAdjustStockScreen';
import { useToast } from '@/ui/components/Toast';
import { Icon } from '@/ui/icons/Icon';
import { useTheme } from '@/ui/theme';
import { t } from '@/i18n';

export type AdjustStockScreenProps = NativeStackScreenProps<
  InventoryStackParamList,
  typeof Routes.AdjustStock
>;

export function AdjustStockScreen({ route }: AdjustStockScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const toast = useToast();
  const state = useAdjustStockScreen(route.params.balanceId, {
    onSuccess: (message) => {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      toast.show(message);
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.space[4],
          paddingBottom: Math.max(insets.bottom, theme.space[4]),
          justifyContent: 'space-between',
          gap: theme.space[4],
        }}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: theme.colors.surface.background }}
      >
        <Box gap={4}>
          <Text variant="body" color="secondary">
            {state.sku} · {state.productName}
          </Text>
          <Box padding={4} radius="md" background="surfaceRaised" border="subtle" gap={2}>
            <Text variant="overline" color="secondary">
              {t('inventory.onHand')}
            </Text>
            <Text
              variant="numericLg"
              accessibilityLabel={`${t('inventory.onHand')} ${state.onHandLabel}`}
            >
              {state.onHandLabel}
            </Text>
          </Box>
          <Text variant="label">{t('inventory.deltaLabel')}</Text>
          <QuantityStepper value={state.delta} onChange={state.setDelta} />
          {state.resultingOnHand !== null ? (
            <Text variant="bodySm" color="secondary">
              {t('inventory.resultingOnHand')}: {state.resultingOnHand}
            </Text>
          ) : null}
          <Input
            label={t('inventory.reason')}
            value={state.reason}
            onChangeText={state.setReason}
            autoCapitalize="none"
          />
          {state.errorMessage ? (
            <Box row align="center" gap={2} accessibilityLiveRegion="polite">
              <Icon name="error" size={16} color={theme.colors.status.danger} />
              <Text variant="bodySm" color="danger">
                {state.errorMessage}
              </Text>
            </Box>
          ) : null}
          {state.successMessage ? (
            <Box row align="center" gap={2} accessibilityLiveRegion="polite">
              <Icon name="check" size={16} color={theme.colors.status.success} />
              <Text variant="bodySm" color="success">
                {state.successMessage}
              </Text>
            </Box>
          ) : null}
        </Box>
        <Button
          label={t('inventory.confirmAdjust')}
          onPress={state.confirm}
          loading={state.isSubmitting}
          disabled={state.delta === 0 || state.isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

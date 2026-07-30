import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { InventoryStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { QuantityStepper } from '@/ui/components/QuantityStepper';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { useAdjustStockScreen } from '@/features/inventory/presentation/hooks/useAdjustStockScreen';
import { t } from '@/i18n';

export type AdjustStockScreenProps = NativeStackScreenProps<
  InventoryStackParamList,
  typeof Routes.AdjustStock
>;

export function AdjustStockScreen({ route }: AdjustStockScreenProps): React.JSX.Element {
  const state = useAdjustStockScreen(route.params.balanceId);

  return (
    <Box flex={1} background="background" padding={4} gap={4} justify="space-between">
      <Box gap={4}>
        <Text variant="h1">{t('inventory.adjust')}</Text>
        <Text variant="body" color="secondary">
          {state.sku} · {state.productName}
        </Text>
        <Text variant="numericLg" accessibilityLabel={`On hand ${state.onHandLabel}`}>
          {state.onHandLabel}
        </Text>
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
          <Text variant="bodySm" color="danger" accessibilityLiveRegion="polite">
            {state.errorMessage}
          </Text>
        ) : null}
        {state.successMessage ? (
          <Text variant="bodySm" color="success" accessibilityLiveRegion="polite">
            {state.successMessage}
          </Text>
        ) : null}
      </Box>
      <Button
        label={t('inventory.confirmAdjust')}
        onPress={state.confirm}
        loading={state.isSubmitting}
        disabled={state.delta === 0 || state.isSubmitting}
      />
    </Box>
  );
}

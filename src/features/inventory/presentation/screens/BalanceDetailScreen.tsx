import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { InventoryStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Button } from '@/ui/components/Button';
import { Badge } from '@/ui/components/Badge';
import { StateView } from '@/ui/feedback/StateView';
import { InventoryListSkeleton } from '@/features/inventory/presentation/components/InventoryListSkeleton';
import { useBalanceDetailScreen } from '@/features/inventory/presentation/hooks/useBalanceDetailScreen';
import { Icon } from '@/ui/icons/Icon';
import { useTheme } from '@/ui/theme';
import { t } from '@/i18n';

export type BalanceDetailScreenProps = NativeStackScreenProps<
  InventoryStackParamList,
  typeof Routes.BalanceDetail
>;

export function BalanceDetailScreen({
  route,
  navigation,
}: BalanceDetailScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const state = useBalanceDetailScreen(route.params.balanceId);

  if (state.isLoading) {
    return (
      <Box flex={1} background="background" padding={4}>
        <InventoryListSkeleton count={3} />
      </Box>
    );
  }

  if (state.errorMessage) {
    return (
      <StateView
        kind="error"
        headline={t('inventory.errorHeadline')}
        body={state.errorMessage}
        actionLabel={t('inventory.retry')}
        onAction={state.refresh}
      />
    );
  }

  return (
    <Box
      flex={1}
      background="background"
      padding={4}
      gap={4}
      style={{ paddingBottom: Math.max(insets.bottom, theme.space[4]) }}
      justify="space-between"
    >
      <Box gap={4}>
        <Box gap={1}>
          <Text variant="overline" color="secondary">
            {state.sku}
          </Text>
          <Text variant="h1">{state.productName}</Text>
          <Box row align="center" gap={2}>
            <Icon name="inventory" size={16} color={theme.colors.text.tertiary} />
            <Text variant="bodySm" color="secondary">
              {t('inventory.location')}: {state.locationCode}
            </Text>
            {state.pendingSync ? (
              <Badge
                label={t('inventory.pendingBadge')}
                variant="sync-pending"
                icon={
                  <Icon name="pending" size={12} color={theme.colors.sync.pending} />
                }
              />
            ) : null}
          </Box>
        </Box>

        <Box
          padding={4}
          radius="md"
          background="surfaceRaised"
          border="subtle"
          gap={2}
          accessibilityLabel={state.accessibilityQuantity}
        >
          <Text variant="overline" color="secondary">
            {t('inventory.onHand')}
          </Text>
          <Text variant="numericLg">{state.onHandLabel}</Text>
          <Text variant="bodySm" color="secondary">
            {t('inventory.available')}: {state.availableLabel}
          </Text>
        </Box>
      </Box>

      <Button
        label={t('inventory.adjust')}
        onPress={() =>
          navigation.navigate(Routes.AdjustStock, { balanceId: route.params.balanceId })
        }
      />
    </Box>
  );
}

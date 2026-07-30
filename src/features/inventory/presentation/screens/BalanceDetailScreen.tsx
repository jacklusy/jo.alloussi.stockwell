import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { InventoryStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Button } from '@/ui/components/Button';
import { t } from '@/i18n';

export type BalanceDetailScreenProps = NativeStackScreenProps<
  InventoryStackParamList,
  typeof Routes.BalanceDetail
>;

export function BalanceDetailScreen({
  route,
  navigation,
}: BalanceDetailScreenProps): React.JSX.Element {
  return (
    <Box flex={1} background="background" padding={4} gap={4}>
      <Text variant="overline" color="secondary">
        {route.params.balanceId}
      </Text>
      <Text variant="numericLg" accessibilityLabel="On hand: 120 units">
        120
      </Text>
      <Button
        label={t('inventory.adjust')}
        onPress={() =>
          navigation.navigate(Routes.AdjustStock, { balanceId: route.params.balanceId })
        }
      />
    </Box>
  );
}

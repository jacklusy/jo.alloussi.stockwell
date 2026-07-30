import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { InventoryStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { QuantityStepper } from '@/ui/components/QuantityStepper';
import { Button } from '@/ui/components/Button';
import { t } from '@/i18n';

export type AdjustStockScreenProps = NativeStackScreenProps<
  InventoryStackParamList,
  typeof Routes.AdjustStock
>;

export function AdjustStockScreen(_props: AdjustStockScreenProps): React.JSX.Element {
  const [qty, setQty] = useState(0);
  return (
    <Box flex={1} background="background" padding={4} gap={4} justify="space-between">
      <Box gap={4}>
        <Text variant="h1">{t('inventory.adjust')}</Text>
        <QuantityStepper value={qty} onChange={setQty} />
      </Box>
      <Button label={t('inventory.confirmAdjust')} onPress={() => undefined} />
    </Box>
  );
}

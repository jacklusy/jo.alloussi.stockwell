import React, { useCallback } from 'react';
import { RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  useNavigation,
  type CompositeNavigationProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { SearchBar } from '@/ui/components/SearchBar';
import { Button } from '@/ui/components/Button';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { StateView } from '@/ui/feedback/StateView';
import { BalanceRow } from '@/features/inventory/presentation/components/BalanceRow';
import { useInventoryListScreen } from '@/features/inventory/presentation/hooks/useInventoryListScreen';
import type { BalanceRowViewModel } from '@/features/inventory/presentation/mappers/balance-row.mapper';
import type { InventoryStackParamList, MainStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { t } from '@/i18n';

type ListNav = CompositeNavigationProp<
  NativeStackNavigationProp<InventoryStackParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;

export function InventoryListScreen(): React.JSX.Element {
  const navigation = useNavigation<ListNav>();
  const state = useInventoryListScreen();

  const onPressRow = useCallback(
    (id: string) => {
      navigation.navigate(Routes.BalanceDetail, { balanceId: id });
    },
    [navigation],
  );

  const openScanner = useCallback(() => {
    (navigation.navigate as (name: string, params?: object) => void)(Routes.Modals, {
      screen: Routes.Scanner,
    });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: BalanceRowViewModel }) => (
      <BalanceRow item={item} onPress={onPressRow} />
    ),
    [onPressRow],
  );

  const keyExtractor = useCallback((item: BalanceRowViewModel) => item.id, []);

  return (
    <Box flex={1} background="background">
      <Box padding={4} gap={3} flex={1}>
        <Box row justify="space-between" align="center">
          <Text variant="h1">{t('inventory.title')}</Text>
          <Button
            label={t('scanner.open')}
            size="sm"
            variant="secondary"
            onPress={openScanner}
            accessibilityLabel={t('scanner.open')}
          />
        </Box>
        <SearchBar
          value={state.search}
          onChangeText={state.setSearch}
          placeholder={t('inventory.search')}
        />

        {state.isLoading ? (
          <Box gap={2}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={`sk-${index}`} width="100%" height={56} />
            ))}
          </Box>
        ) : state.errorMessage ? (
          <StateView
            kind="error"
            headline={t('inventory.errorHeadline')}
            body={state.errorMessage}
            actionLabel={t('inventory.retry')}
            onAction={state.refresh}
          />
        ) : state.items.length === 0 ? (
          <StateView
            kind="empty"
            headline={
              state.search ? t('inventory.noResultsHeadline') : t('inventory.emptyHeadline')
            }
            body={
              state.search ? t('inventory.noResultsBody') : t('inventory.emptyBody')
            }
          />
        ) : (
          <FlashList
            data={state.items}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onEndReached={state.loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl refreshing={state.isRefreshing} onRefresh={state.refresh} />
            }
          />
        )}
      </Box>
    </Box>
  );
}

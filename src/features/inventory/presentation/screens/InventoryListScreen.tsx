import React, { useCallback } from 'react';
import { RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  type CompositeNavigationProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Box } from '@/ui/primitives/Box';
import { SearchBar } from '@/ui/components/SearchBar';
import { Button } from '@/ui/components/Button';
import { StateView } from '@/ui/feedback/StateView';
import { InventoryListSkeleton } from '@/features/inventory/presentation/components/InventoryListSkeleton';
import { BalanceRow } from '@/features/inventory/presentation/components/BalanceRow';
import { useInventoryListScreen } from '@/features/inventory/presentation/hooks/useInventoryListScreen';
import type { BalanceRowViewModel } from '@/features/inventory/presentation/mappers/balance-row.mapper';
import type { InventoryStackParamList, MainStackParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Icon } from '@/ui/icons/Icon';
import { useTheme } from '@/ui/theme';
import { t } from '@/i18n';

type ListNav = CompositeNavigationProp<
  NativeStackNavigationProp<InventoryStackParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;

export function InventoryListScreen(): React.JSX.Element {
  const navigation = useNavigation<ListNav>();
  const state = useInventoryListScreen();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
    <Box
      flex={1}
      background="background"
      style={{ paddingBottom: insets.bottom }}
    >
      <Box padding={4} gap={3} flex={1}>
        <Box row justify="space-between" align="center" gap={3}>
          <Box flex={1}>
            <SearchBar
              value={state.search}
              onChangeText={state.setSearch}
              placeholder={t('inventory.search')}
            />
          </Box>
          <Button
            label={t('scanner.open')}
            size="sm"
            variant="secondary"
            onPress={openScanner}
            accessibilityLabel={t('scanner.open')}
            leadingIcon={
              <Icon name="scan" size={18} color={theme.colors.brand.primary} />
            }
          />
        </Box>

        {state.isLoading ? (
          <InventoryListSkeleton />
        ) : state.errorMessage ? (
          <StateView
            kind="error"
            headline={t('inventory.errorHeadline')}
            body={state.errorMessage}
            actionLabel={t('inventory.retry')}
            onAction={state.refresh}
          />
        ) : state.items.length === 0 ? (
          state.search ? (
            <StateView
              kind="empty"
              headline={t('inventory.noResultsHeadline')}
              body={t('inventory.noResultsBody')}
            />
          ) : (
            <StateView
              kind="empty"
              headline={t('inventory.emptyHeadline')}
              body={t('inventory.emptyBody')}
              actionLabel={t('scanner.open')}
              onAction={openScanner}
            />
          )
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

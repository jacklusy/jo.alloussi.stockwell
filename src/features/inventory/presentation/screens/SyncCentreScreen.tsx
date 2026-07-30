import React, { useCallback } from 'react';
import { Alert, SectionList } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { ListRow } from '@/ui/components/ListRow';
import { Button } from '@/ui/components/Button';
import { StateView } from '@/ui/feedback/StateView';
import { InventoryListSkeleton } from '@/features/inventory/presentation/components/InventoryListSkeleton';
import { useTheme } from '@/ui/theme';
import { useSyncCentreScreen } from '@/features/inventory/presentation/hooks/useSyncCentreScreen';
import type { SyncCentreItem } from '@/features/inventory/application/use-cases/sync-centre.usecase';
import { Routes } from '@/navigation/routes';
import { t } from '@/i18n';

function sectionTitle(section: string): string {
  switch (section) {
    case 'CONFLICT':
      return t('sync.sectionConflict');
    case 'PENDING':
      return t('sync.sectionPending');
    case 'FAILED':
      return t('sync.sectionFailed');
    case 'DEAD':
      return t('sync.sectionDead');
    default:
      return section;
  }
}

export function SyncCentreScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation();

  const onOpenConflict = useCallback(
    (queueItemId: string) => {
      (navigation.navigate as (name: string, params?: object) => void)(Routes.Modals, {
        screen: Routes.ConflictResolution,
        params: { queueItemId },
      });
    },
    [navigation],
  );

  const state = useSyncCentreScreen(onOpenConflict);

  const confirmDiscard = useCallback(
    (id: string) => {
      Alert.alert(t('sync.discardTitle'), t('sync.discardBody'), [
        { text: t('sync.cancel'), style: 'cancel' },
        {
          text: t('sync.discardConfirm'),
          style: 'destructive',
          onPress: () => state.discard(id),
        },
      ]);
    },
    [state],
  );

  const renderItem = useCallback(
    ({ item }: { item: SyncCentreItem }) => {
      const rail =
        item.section === 'CONFLICT'
          ? theme.colors.sync.conflict
          : item.section === 'DEAD' || item.section === 'FAILED'
            ? theme.colors.sync.failed
            : theme.colors.sync.pending;

      return (
        <Box gap={2} paddingBottom={2}>
          <ListRow
            title={item.summary}
            subtitle={item.lastError ?? `${item.type} · attempts ${item.attempts}`}
            syncRailColor={rail}
            accessibilityLabel={`${item.summary}, ${item.section}`}
            {...(item.section === 'CONFLICT'
              ? { onPress: () => state.openConflict(item.id) }
              : {})}
          />
          <Box row gap={2} paddingX={4}>
            {item.section === 'CONFLICT' ? (
              <Button
                label={t('sync.resolve')}
                size="sm"
                onPress={() => state.openConflict(item.id)}
              />
            ) : null}
            {item.section === 'FAILED' || item.section === 'DEAD' ? (
              <Button label={t('sync.retry')} size="sm" onPress={() => state.retry(item.id)} />
            ) : null}
            {item.section !== 'PENDING' ? (
              <Button
                label={t('sync.discard')}
                size="sm"
                variant="ghost"
                onPress={() => confirmDiscard(item.id)}
              />
            ) : null}
          </Box>
        </Box>
      );
    },
    [confirmDiscard, state, theme.colors.sync],
  );

  if (state.isLoading && state.isEmpty) {
    return (
      <Box flex={1} background="background" padding={4}>
        <InventoryListSkeleton count={5} />
      </Box>
    );
  }

  if (state.isEmpty) {
    return (
      <Box flex={1} background="background">
        <StateView
          kind="empty"
          headline={t('sync.emptyHeadline')}
          body={t('sync.emptyBody')}
        />
      </Box>
    );
  }

  const sections = state.groups.map((group) => ({
    title: sectionTitle(group.section),
    data: group.items,
  }));

  return (
    <Box flex={1} background="background">
      {state.errorMessage ? (
        <Box padding={4}>
          <Text variant="bodySm" color="danger" accessibilityLiveRegion="polite">
            {state.errorMessage}
          </Text>
        </Box>
      ) : null}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Box paddingX={4} paddingY={2} background="background">
            <Text variant="overline" color="secondary">
              {section.title}
            </Text>
          </Box>
        )}
        stickySectionHeadersEnabled
      />
    </Box>
  );
}

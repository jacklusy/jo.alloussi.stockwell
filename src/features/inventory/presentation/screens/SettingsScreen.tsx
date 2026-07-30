import React from 'react';
import { type CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MainStackParamList, TabsParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { ListRow } from '@/ui/components/ListRow';
import { useSettingsScreen } from '@/features/inventory/presentation/hooks/useSettingsScreen';
import { t } from '@/i18n';

type SettingsNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, typeof Routes.Settings>,
  NativeStackNavigationProp<MainStackParamList>
>;

export function SettingsScreen(): React.JSX.Element {
  const state = useSettingsScreen();
  const navigation = useNavigation<SettingsNavigation>();

  return (
    <Box flex={1} background="background" padding={4} gap={2}>
      <Text variant="h1">{t('settings.title')}</Text>
      <ListRow
        title={t('settings.theme')}
        subtitle={state.preference}
        onPress={state.cycleTheme}
        accessibilityLabel={`${t('settings.theme')}, ${state.preference}`}
      />
      {__DEV__ ? (
        <ListRow
          title={t('settings.gallery')}
          chevron
          onPress={() => navigation.navigate(Routes.ComponentGallery)}
        />
      ) : null}
      <ListRow
        title={t('settings.logout')}
        onPress={state.logout}
        accessibilityLabel={t('settings.logout')}
      />
    </Box>
  );
}

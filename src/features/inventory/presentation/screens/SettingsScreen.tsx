import React from 'react';
import {
  type CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MainStackParamList, TabsParamList } from '@/navigation/types';
import { Routes } from '@/navigation/routes';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { ListRow } from '@/ui/components/ListRow';
import { useThemeStore } from '@/ui/theme';
import { t } from '@/i18n';

type SettingsNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, typeof Routes.Settings>,
  NativeStackNavigationProp<MainStackParamList>
>;

export function SettingsScreen(): React.JSX.Element {
  const setPreference = useThemeStore((s) => s.setPreference);
  const preference = useThemeStore((s) => s.preference);
  const navigation = useNavigation<SettingsNavigation>();

  return (
    <Box flex={1} background="background" padding={4} gap={2}>
      <Text variant="h1">{t('settings.title')}</Text>
      <ListRow
        title={t('settings.theme')}
        subtitle={preference}
        onPress={() => {
          const next =
            preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
          setPreference(next);
        }}
      />
      {__DEV__ ? (
        <ListRow
          title={t('settings.gallery')}
          chevron
          onPress={() => navigation.navigate(Routes.ComponentGallery)}
        />
      ) : null}
      <ListRow title={t('settings.logout')} onPress={() => undefined} />
    </Box>
  );
}

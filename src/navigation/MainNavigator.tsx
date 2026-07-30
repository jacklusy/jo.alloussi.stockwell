import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  AdjustStockScreen,
  BalanceDetailScreen,
  ComponentGalleryScreen,
  InventoryListScreen,
  SettingsScreen,
  SyncCentreScreen,
} from '@/features/inventory';
import { WarehouseSelectScreen } from '@/features/warehouses';
import { Routes } from '@/navigation/routes';
import type {
  InventoryStackParamList,
  MainStackParamList,
  TabsParamList,
} from '@/navigation/types';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';
import { t } from '@/i18n';

const MainStack = createNativeStackNavigator<MainStackParamList>();
const InventoryStack = createNativeStackNavigator<InventoryStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

function TabGlyph({ glyph, color }: { glyph: string; color: string }): React.JSX.Element {
  return (
    <Text variant="body" style={{ color }}>
      {glyph}
    </Text>
  );
}

function InventoryStackNavigator(): React.JSX.Element {
  const theme = useTheme();
  return (
    <InventoryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface.background },
        headerTintColor: theme.colors.text.primary,
        contentStyle: { backgroundColor: theme.colors.surface.background },
      }}
    >
      <InventoryStack.Screen
        name={Routes.InventoryList}
        component={InventoryListScreen}
        options={{ title: t('inventory.title') }}
      />
      <InventoryStack.Screen name={Routes.BalanceDetail} component={BalanceDetailScreen} />
      <InventoryStack.Screen name={Routes.AdjustStock} component={AdjustStockScreen} />
    </InventoryStack.Navigator>
  );
}

function InventoryTabIcon({ color }: { color: string }): React.JSX.Element {
  return <TabGlyph glyph="▣" color={color} />;
}

function SyncTabIcon({ color }: { color: string }): React.JSX.Element {
  return <TabGlyph glyph="↻" color={color} />;
}

function SettingsTabIcon({ color }: { color: string }): React.JSX.Element {
  return <TabGlyph glyph="⚙" color={color} />;
}

function TabsNavigator(): React.JSX.Element {
  const theme = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.surfaceRaised,
          borderTopColor: theme.colors.border.subtle,
        },
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
      }}
    >
      <Tabs.Screen
        name={Routes.InventoryTab}
        component={InventoryStackNavigator}
        options={{
          title: t('tabs.inventory'),
          tabBarIcon: InventoryTabIcon,
        }}
      />
      <Tabs.Screen
        name={Routes.SyncCentre}
        component={SyncCentreScreen}
        options={{
          headerShown: true,
          title: t('tabs.sync'),
          tabBarIcon: SyncTabIcon,
        }}
      />
      <Tabs.Screen
        name={Routes.Settings}
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: t('tabs.settings'),
          tabBarIcon: SettingsTabIcon,
        }}
      />
    </Tabs.Navigator>
  );
}

export function MainNavigator(): React.JSX.Element {
  const theme = useTheme();
  return (
    <MainStack.Navigator
      initialRouteName={Routes.Tabs}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface.background },
        headerTintColor: theme.colors.text.primary,
        contentStyle: { backgroundColor: theme.colors.surface.background },
      }}
    >
      <MainStack.Screen
        name={Routes.WarehouseSelect}
        component={WarehouseSelectScreen}
        options={{ title: t('warehouse.title') }}
      />
      <MainStack.Screen
        name={Routes.Tabs}
        component={TabsNavigator}
        options={{ headerShown: false }}
      />
      {__DEV__ ? (
        <MainStack.Screen
          name={Routes.ComponentGallery}
          component={ComponentGalleryScreen}
          options={{ title: 'Gallery' }}
        />
      ) : null}
    </MainStack.Navigator>
  );
}

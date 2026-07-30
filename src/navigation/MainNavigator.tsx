import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  AdjustStockScreen,
  BalanceDetailScreen,
  ComponentGalleryScreen,
  ConflictResolutionScreen,
  InventoryListScreen,
  PermissionDeniedScreen,
  ScannerScreen,
  SettingsScreen,
  SyncCentreScreen,
} from '@/features/inventory';
import { WarehouseSelectScreen } from '@/features/warehouses';
import { Routes } from '@/navigation/routes';
import type {
  InventoryStackParamList,
  MainStackParamList,
  ModalStackParamList,
  TabsParamList,
} from '@/navigation/types';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';
import { SyncStatusIndicator } from '@/ui/feedback/SyncStatusIndicator';
import { useSyncStatusStore } from '@/services/auth/sync-status-store';
import { t } from '@/i18n';

const MainStack = createNativeStackNavigator<MainStackParamList>();
const InventoryStack = createNativeStackNavigator<InventoryStackParamList>();
const ModalStack = createNativeStackNavigator<ModalStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

function TabGlyph({ glyph, color }: { glyph: string; color: string }): React.JSX.Element {
  return (
    <Text variant="body" style={{ color }}>
      {glyph}
    </Text>
  );
}

function HeaderSyncStatus(): React.JSX.Element {
  const status = useSyncStatusStore((s) => s.status);
  const navigation = useNavigation();
  return (
    <SyncStatusIndicator
      status={status}
      onPress={() => {
        navigation.navigate(Routes.SyncCentre as never);
      }}
    />
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
        headerRight: HeaderSyncStatus,
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

function TabGlyphInventory({ color }: { color: string }): React.JSX.Element {
  return <TabGlyph glyph="▣" color={color} />;
}

function TabGlyphSync({ color }: { color: string }): React.JSX.Element {
  return <TabGlyph glyph="↻" color={color} />;
}

function TabGlyphSettings({ color }: { color: string }): React.JSX.Element {
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
          tabBarIcon: TabGlyphInventory,
        }}
      />
      <Tabs.Screen
        name={Routes.SyncCentre}
        component={SyncCentreScreen}
        options={{
          headerShown: true,
          title: t('tabs.sync'),
          tabBarIcon: TabGlyphSync,
          headerRight: HeaderSyncStatus,
        }}
      />
      <Tabs.Screen
        name={Routes.Settings}
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: t('tabs.settings'),
          tabBarIcon: TabGlyphSettings,
        }}
      />
    </Tabs.Navigator>
  );
}

function ModalsNavigator(): React.JSX.Element {
  const theme = useTheme();
  return (
    <ModalStack.Navigator
      screenOptions={{
        presentation: 'modal',
        headerStyle: { backgroundColor: theme.colors.surface.background },
        headerTintColor: theme.colors.text.primary,
      }}
    >
      <ModalStack.Screen
        name={Routes.Scanner}
        component={ScannerScreen}
        options={{ title: t('scanner.title') }}
      />
      <ModalStack.Screen
        name={Routes.ConflictResolution}
        component={ConflictResolutionScreen}
        options={{ title: t('sync.conflictTitle') }}
      />
      <ModalStack.Screen
        name={Routes.PermissionDenied}
        component={PermissionDeniedScreen}
        options={{ title: t('permissions.cameraDeniedHeadline') }}
      />
    </ModalStack.Navigator>
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
      <MainStack.Screen
        name={Routes.Modals}
        component={ModalsNavigator}
        options={{ headerShown: false, presentation: 'modal' }}
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

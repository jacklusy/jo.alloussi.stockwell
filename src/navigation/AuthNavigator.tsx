import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/features/auth';
import { Routes } from '@/navigation/routes';
import type { AuthStackParamList } from '@/navigation/types';
import { useTheme } from '@/ui/theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator(): React.JSX.Element {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface.background },
        headerTintColor: theme.colors.text.primary,
        contentStyle: { backgroundColor: theme.colors.surface.background },
      }}
    >
      <Stack.Screen
        name={Routes.Login}
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

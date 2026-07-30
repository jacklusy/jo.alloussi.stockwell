import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableFreeze, enableScreens } from 'react-native-screens';

import { BootstrapScreen } from '@/features/auth';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { MainNavigator } from '@/navigation/MainNavigator';
import { Routes } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/ui/theme';

enableScreens(true);
enableFreeze(true);

const Stack = createNativeStackNavigator<RootStackParamList>();

type SessionPhase = 'bootstrapping' | 'unauthenticated' | 'authenticated';

export function RootNavigator(): React.JSX.Element {
  const theme = useTheme();
  const [phase, setPhase] = useState<SessionPhase>('bootstrapping');

  useEffect(() => {
    // Epic 2 will restore session / biometrics here.
    const id = setTimeout(() => setPhase('authenticated'), 400);
    return () => clearTimeout(id);
  }, []);

  return (
    <NavigationContainer
      theme={{
        dark: theme.mode === 'dark',
        colors: {
          primary: theme.colors.brand.primary,
          background: theme.colors.surface.background,
          card: theme.colors.surface.surfaceRaised,
          text: theme.colors.text.primary,
          border: theme.colors.border.subtle,
          notification: theme.colors.sync.conflict,
        },
        fonts: {
          regular: { fontFamily: 'Inter', fontWeight: '400' },
          medium: { fontFamily: 'Inter-Medium', fontWeight: '500' },
          bold: { fontFamily: 'Inter-Bold', fontWeight: '700' },
          heavy: { fontFamily: 'Inter-Bold', fontWeight: '700' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {phase === 'bootstrapping' ? (
          <Stack.Screen name={Routes.Bootstrap} component={BootstrapScreen} />
        ) : phase === 'unauthenticated' ? (
          <Stack.Screen name={Routes.Auth} component={AuthNavigator} />
        ) : (
          <Stack.Screen name={Routes.Main} component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

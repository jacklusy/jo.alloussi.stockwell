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
import { bootstrapApp } from '@/app/bootstrap/bootstrap-app';
import { useSessionStore } from '@/services/auth/session-store';
import { StateView } from '@/ui/feedback/StateView';
import { Box } from '@/ui/primitives/Box';

enableScreens(true);
enableFreeze(true);

const Stack = createNativeStackNavigator<RootStackParamList>();

type SessionPhase = 'bootstrapping' | 'unauthenticated' | 'authenticated' | 'error';

export function RootNavigator(): React.JSX.Element {
  const theme = useTheme();
  const user = useSessionStore((s) => s.user);
  const isHydrated = useSessionStore((s) => s.isHydrated);
  const [phase, setPhase] = useState<SessionPhase>('bootstrapping');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void bootstrapApp().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.phase === 'error') {
        setErrorMessage(result.message);
        setPhase('error');
        return;
      }
      setPhase(result.phase);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || phase === 'bootstrapping' || phase === 'error') {
      return;
    }
    setPhase(user ? 'authenticated' : 'unauthenticated');
  }, [user, isHydrated, phase]);

  if (phase === 'error') {
    return (
      <Box flex={1} background="background">
        <StateView
          kind="error"
          headline="Could not start"
          body={errorMessage ?? 'Reset local data and try again.'}
          actionLabel="Retry"
          onAction={() => {
            setPhase('bootstrapping');
            useSessionStore.getState().setHydrated(false);
            void bootstrapApp().then((result) => {
              if (result.phase === 'error') {
                setErrorMessage(result.message);
                setPhase('error');
                return;
              }
              setPhase(result.phase);
            });
          }}
        />
      </Box>
    );
  }

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

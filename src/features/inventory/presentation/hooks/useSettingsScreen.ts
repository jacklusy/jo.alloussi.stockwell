import { useCallback } from 'react';
import { Alert } from 'react-native';

import { container, TOKENS } from '@/core/di';
import type { LogoutUseCase } from '@/features/auth/application/use-cases/logout.usecase';
import { useThemeStore } from '@/ui/theme';
import { t } from '@/i18n';

export type SettingsViewState = {
  preference: 'system' | 'light' | 'dark';
  cycleTheme: () => void;
  logout: () => void;
};

export function useSettingsScreen(): SettingsViewState {
  const setPreference = useThemeStore((s) => s.setPreference);
  const preference = useThemeStore((s) => s.preference);

  const cycleTheme = useCallback(() => {
    const next = preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
    setPreference(next);
  }, [preference, setPreference]);

  const logout = useCallback(() => {
    const run = (confirmQueueDiscard: boolean) => {
      const useCase = container.resolve<LogoutUseCase>(TOKENS.LOGOUT_USE_CASE);
      void useCase.execute({ confirmQueueDiscard }).then((result) => {
        if (!result.ok) {
          Alert.alert(t('settings.logout'), result.error.userMessage, [
            { text: t('sync.cancel'), style: 'cancel' },
            {
              text: t('settings.discardAndLogout'),
              style: 'destructive',
              onPress: () => run(true),
            },
          ]);
          return;
        }
      });
    };
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('sync.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: () => run(false),
      },
    ]);
  }, []);

  return { preference, cycleTheme, logout };
}

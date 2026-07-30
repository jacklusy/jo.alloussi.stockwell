import type { ThemePreference } from '@/ui/theme/theme';

type ThemePersistence = {
  get: () => ThemePreference;
  set: (preference: ThemePreference) => void;
};

const memory = { preference: 'system' as ThemePreference };

let persistence: ThemePersistence = {
  get: () => memory.preference,
  set: (preference) => {
    memory.preference = preference;
  },
};

/** Wired once at bootstrap to MMKV (or a test fake). */
export function configureThemePersistence(next: ThemePersistence): void {
  persistence = next;
}

export function readThemePreference(): ThemePreference {
  return persistence.get();
}

export function writeThemePreference(preference: ThemePreference): void {
  persistence.set(preference);
}

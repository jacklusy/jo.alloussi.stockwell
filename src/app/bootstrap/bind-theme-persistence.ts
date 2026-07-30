import { kvStorage } from '@/storage/kv/mmkv';
import { configureThemePersistence } from '@/ui/theme/theme-persistence';
import type { ThemePreference } from '@/ui/theme/theme';

const THEME_KEY = 'theme.preference';

function isPreference(value: string | undefined): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Bind theme preference to MMKV — call once at bootstrap. */
export function bindThemePersistence(): void {
  configureThemePersistence({
    get: () => {
      const stored = kvStorage.getString(THEME_KEY);
      return isPreference(stored) ? stored : 'system';
    },
    set: (preference) => {
      kvStorage.set(THEME_KEY, preference);
    },
  });
}

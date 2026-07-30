import { create } from 'zustand';

import type { ThemePreference } from '@/ui/theme/theme';
import { readThemePreference, writeThemePreference } from '@/ui/theme/theme-persistence';

type ThemeSlice = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  hydrate: () => void;
};

export const useThemeStore = create<ThemeSlice>((set) => ({
  preference: readThemePreference(),
  hydrate: () => {
    set({ preference: readThemePreference() });
  },
  setPreference: (preference) => {
    writeThemePreference(preference);
    set({ preference });
  },
}));

import type { ColorTokens } from '@/ui/tokens/colors';
import { darkColors, lightColors } from '@/ui/tokens/colors';
import { radius } from '@/ui/tokens/radius';
import { space } from '@/ui/tokens/spacing';
import { typography } from '@/ui/tokens/typography';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  colors: ColorTokens;
  space: typeof space;
  radius: typeof radius;
  typography: typeof typography;
};

export function createTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    space,
    radius,
    typography,
  };
}

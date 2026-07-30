import { darkColors, lightColors, type ColorTokens } from '@/ui/tokens/colors';
import { contrastRatio } from '@/core/utils/contrast';

type Check = {
  name: string;
  fg: string;
  bg: string;
  min: number;
};

function collectChecks(colors: ColorTokens, theme: string): Check[] {
  return [
    {
      name: `${theme} body on background`,
      fg: colors.text.primary,
      bg: colors.surface.background,
      min: 4.5,
    },
    {
      name: `${theme} body on surface`,
      fg: colors.text.primary,
      bg: colors.surface.surface,
      min: 4.5,
    },
    {
      name: `${theme} body on raised`,
      fg: colors.text.primary,
      bg: colors.surface.surfaceRaised,
      min: 4.5,
    },
    {
      name: `${theme} secondary on background`,
      fg: colors.text.secondary,
      bg: colors.surface.background,
      min: 4.5,
    },
    {
      name: `${theme} tertiary on background`,
      fg: colors.text.tertiary,
      bg: colors.surface.background,
      min: 4.5,
    },
    {
      name: `${theme} tertiary on surface`,
      fg: colors.text.tertiary,
      bg: colors.surface.surface,
      min: 4.5,
    },
    {
      name: `${theme} onBrand on primary`,
      fg: colors.brand.onPrimary,
      bg: colors.brand.primary,
      min: 4.5,
    },
    {
      name: `${theme} border.default on background`,
      fg: colors.border.default,
      bg: colors.surface.background,
      min: 3,
    },
    {
      name: `${theme} border.focus on background`,
      fg: colors.border.focus,
      bg: colors.surface.background,
      min: 3,
    },
    {
      name: `${theme} danger on background`,
      fg: colors.status.danger,
      bg: colors.surface.background,
      min: 3,
    },
    {
      name: `${theme} sync.pending on background`,
      fg: colors.sync.pending,
      bg: colors.surface.background,
      min: 3,
    },
    {
      name: `${theme} sync.conflict on background`,
      fg: colors.sync.conflict,
      bg: colors.surface.background,
      min: 3,
    },
  ];
}

describe('design token contrast', () => {
  const checks = [...collectChecks(lightColors, 'light'), ...collectChecks(darkColors, 'dark')];

  it.each(checks)('$name meets WCAG ($min:1)', ({ fg, bg, min }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});

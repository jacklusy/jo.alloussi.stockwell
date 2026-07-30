import React from 'react';
import {
  Text as RNText,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { useTheme } from '@/ui/theme';
import type { TypographyVariant } from '@/ui/tokens/typography';

export type TextProps = Omit<RNTextProps, 'style'> & {
  variant?: TypographyVariant;
  color?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'inverse'
    | 'onBrand'
    | 'danger'
    | 'success'
    | 'warning';
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
};

export function Text({
  variant = 'body',
  color = 'primary',
  align,
  style,
  maxFontSizeMultiplier = 1.6,
  allowFontScaling = true,
  ...rest
}: TextProps): React.JSX.Element {
  const theme = useTheme();

  const colorMap: Record<NonNullable<TextProps['color']>, string> = {
    primary: theme.colors.text.primary,
    secondary: theme.colors.text.secondary,
    tertiary: theme.colors.text.tertiary,
    inverse: theme.colors.text.inverse,
    onBrand: theme.colors.text.onBrand,
    danger: theme.colors.status.danger,
    success: theme.colors.status.success,
    warning: theme.colors.status.warning,
  };

  return (
    <RNText
      {...rest}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[theme.typography[variant], { color: colorMap[color], textAlign: align }, style]}
    />
  );
}

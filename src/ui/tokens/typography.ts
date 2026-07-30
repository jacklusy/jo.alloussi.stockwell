import type { TextStyle } from 'react-native';

export const fontFamily = {
  sans: 'Inter',
  sansMedium: 'Inter-Medium',
  sansSemiBold: 'Inter-SemiBold',
  sansBold: 'Inter-Bold',
  mono: 'JetBrainsMono-Medium',
  monoBold: 'JetBrainsMono-Bold',
} as const;

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'caption'
  | 'overline'
  | 'button'
  | 'numeric'
  | 'numericLg'
  | 'numericSm';

type TypeStyle = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'textTransform' | 'fontVariant'
>;

export const typography: Record<TypographyVariant, TypeStyle> = {
  display: {
    fontFamily: fontFamily.sansBold,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  h1: {
    fontFamily: fontFamily.sansBold,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },
  h2: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '600',
  },
  h3: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  bodyLg: {
    fontFamily: fontFamily.sans,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '400',
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodySm: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  label: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  overline: {
    fontFamily: fontFamily.sansBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  numeric: {
    fontFamily: fontFamily.mono,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  numericLg: {
    fontFamily: fontFamily.monoBold,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  numericSm: {
    fontFamily: fontFamily.mono,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
};

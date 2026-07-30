import React, { type PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/ui/theme';
import type { SpaceToken } from '@/ui/tokens/spacing';
import type { RadiusToken } from '@/ui/tokens/radius';
import { getElevation, type ElevationLevel } from '@/ui/tokens/elevation';

export type BoxProps = PropsWithChildren<
  ViewProps & {
    padding?: SpaceToken;
    paddingX?: SpaceToken;
    paddingY?: SpaceToken;
    paddingTop?: SpaceToken;
    paddingBottom?: SpaceToken;
    paddingStart?: SpaceToken;
    paddingEnd?: SpaceToken;
    margin?: SpaceToken;
    marginX?: SpaceToken;
    marginY?: SpaceToken;
    marginTop?: SpaceToken;
    marginBottom?: SpaceToken;
    gap?: SpaceToken;
    row?: boolean;
    align?: ViewStyle['alignItems'];
    justify?: ViewStyle['justifyContent'];
    flex?: number;
    background?: 'background' | 'surface' | 'surfaceRaised' | 'surfaceSunken' | 'transparent';
    radius?: RadiusToken;
    elevation?: ElevationLevel;
    border?: 'subtle' | 'default' | 'strong' | 'none';
    style?: StyleProp<ViewStyle>;
  }
>;

export function Box({
  children,
  padding,
  paddingX,
  paddingY,
  paddingTop,
  paddingBottom,
  paddingStart,
  paddingEnd,
  margin,
  marginX,
  marginY,
  marginTop,
  marginBottom,
  gap,
  row,
  align,
  justify,
  flex,
  background = 'transparent',
  radius,
  elevation,
  border = 'none',
  style,
  ...rest
}: BoxProps): React.JSX.Element {
  const theme = useTheme();
  const s = theme.space;

  const bg = background === 'transparent' ? undefined : theme.colors.surface[background];

  const elevationStyle = elevation
    ? getElevation(elevation, theme.mode, theme.colors.border.subtle)
    : undefined;

  return (
    <View
      {...rest}
      style={[
        {
          padding: padding !== undefined ? s[padding] : undefined,
          paddingHorizontal: paddingX !== undefined ? s[paddingX] : undefined,
          paddingVertical: paddingY !== undefined ? s[paddingY] : undefined,
          paddingTop: paddingTop !== undefined ? s[paddingTop] : undefined,
          paddingBottom: paddingBottom !== undefined ? s[paddingBottom] : undefined,
          paddingStart: paddingStart !== undefined ? s[paddingStart] : undefined,
          paddingEnd: paddingEnd !== undefined ? s[paddingEnd] : undefined,
          margin: margin !== undefined ? s[margin] : undefined,
          marginHorizontal: marginX !== undefined ? s[marginX] : undefined,
          marginVertical: marginY !== undefined ? s[marginY] : undefined,
          marginTop: marginTop !== undefined ? s[marginTop] : undefined,
          marginBottom: marginBottom !== undefined ? s[marginBottom] : undefined,
          gap: gap !== undefined ? s[gap] : undefined,
          flexDirection: row ? 'row' : 'column',
          alignItems: align,
          justifyContent: justify,
          flex,
          backgroundColor: bg,
          borderRadius: radius !== undefined ? theme.radius[radius] : undefined,
          borderWidth: border === 'none' ? 0 : 1,
          borderColor:
            border === 'none'
              ? undefined
              : theme.colors.border[border === 'subtle' ? 'subtle' : border],
        },
        elevationStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

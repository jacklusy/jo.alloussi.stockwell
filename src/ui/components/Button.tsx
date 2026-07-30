import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel,
  testID,
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>();
  const lockedWidth = useRef<number | undefined>(undefined);

  const isDisabled = disabled || loading;

  const heights = { sm: 40, md: 48, lg: 56 } as const;
  const paddings = { sm: theme.space[3], md: theme.space[4], lg: theme.space[5] } as const;

  const bg: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: theme.colors.brand.primary,
    secondary: theme.colors.surface.surfaceRaised,
    ghost: 'transparent',
    danger: theme.colors.status.danger,
  };

  const pressedBg: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: theme.colors.brand.primaryPressed,
    secondary: theme.colors.surface.surfaceSunken,
    ghost: theme.colors.surface.surfaceSunken,
    danger: theme.colors.status.danger,
  };

  const labelColor: Record<NonNullable<ButtonProps['variant']>, 'onBrand' | 'primary' | 'inverse'> =
    {
      primary: 'onBrand',
      secondary: 'primary',
      ghost: 'primary',
      danger: 'inverse',
    };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 100 });
  }, [scale]);

  const containerStyle: ViewStyle = {
    minHeight: Math.max(48, heights[size]),
    paddingHorizontal: paddings[size],
    borderRadius: theme.radius.md,
    backgroundColor: bg[variant],
    opacity: isDisabled ? 0.5 : 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: loading && lockedWidth.current ? lockedWidth.current : measuredWidth,
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: theme.colors.border.default,
  };

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (!loading) {
          lockedWidth.current = w;
          setMeasuredWidth(undefined);
        }
      }}
      style={[containerStyle, animatedStyle]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger'
              ? theme.colors.brand.onPrimary
              : theme.colors.text.primary
          }
        />
      ) : (
        <Text variant="button" color={labelColor[variant]}>
          {label}
        </Text>
      )}
      {/* Preserve pressed background via Box overlay for secondary visual feedback */}
      <Box
        style={{
          ...({
            position: 'absolute',
            opacity: 0,
            backgroundColor: pressedBg[variant],
          } as ViewStyle),
        }}
      />
    </AnimatedPressable>
  );
}

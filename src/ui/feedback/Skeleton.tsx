import React, { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

import { useTheme } from '@/ui/theme';

export type SkeletonProps = {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  testID?: string;
};

export function Skeleton({
  width,
  height,
  radius,
  testID,
}: SkeletonProps): React.JSX.Element {
  const theme = useTheme();
  const opacity = useSharedValue(0.4);
  const reduceMotion = useSharedValue(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!mounted) {
          return;
        }
        reduceMotion.value = enabled;
        if (enabled) {
          opacity.value = 0.55;
          return;
        }
        opacity.value = withRepeat(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
      })
      .catch(() => {
        opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
      });
    return () => {
      mounted = false;
    };
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const style: ViewStyle = {
    width,
    height,
    borderRadius: radius ?? theme.radius.md,
    backgroundColor: theme.colors.surface.surfaceSunken,
  };

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[style, animatedStyle]}
    />
  );
}

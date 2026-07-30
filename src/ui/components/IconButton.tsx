import React, { useCallback } from 'react';
import { Pressable, type GestureResponderEvent, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/ui/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type IconButtonProps = {
  icon: React.ReactNode;
  accessibilityLabel: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  testID?: string;
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  testID,
}: IconButtonProps): React.JSX.Element {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 100 });
  }, [scale]);

  const style: ViewStyle = {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    opacity: disabled ? 0.4 : 1,
  };

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={4}
      style={[style, animatedStyle]}
    >
      {icon}
    </AnimatedPressable>
  );
}

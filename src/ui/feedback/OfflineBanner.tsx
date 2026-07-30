import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Icon } from '@/ui/icons/Icon';
import { useTheme } from '@/ui/theme';
import { t } from '@/i18n';

export type OfflineBannerProps = {
  visible: boolean;
  message?: string;
  testID?: string;
};

export function OfflineBanner({
  visible,
  message = t('offline.banner'),
  testID,
}: OfflineBannerProps): React.JSX.Element | null {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(visible ? 0 : -80);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (cancelled) {
          return;
        }
        if (reduce) {
          translateY.value = visible ? 0 : -80;
          return;
        }
        translateY.value = withTiming(visible ? 0 : -80, {
          duration: 250,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
      })
      .catch(() => {
        translateY.value = withTiming(visible ? 0 : -80, { duration: 250 });
      });
    return () => {
      cancelled = true;
    };
  }, [translateY, visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          top: 0,
          start: 0,
          end: 0,
          zIndex: 50,
          paddingTop: insets.top,
          backgroundColor: theme.colors.status.warningSubtle,
        },
        style,
      ]}
    >
      <Box
        testID={testID}
        row
        align="center"
        justify="center"
        gap={2}
        paddingX={4}
        paddingY={2}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      >
        <Icon name="offline" size={16} color={theme.colors.status.warning} />
        <Text variant="bodySm" color="warning" align="center">
          {message}
        </Text>
      </Box>
    </Animated.View>
  );
}

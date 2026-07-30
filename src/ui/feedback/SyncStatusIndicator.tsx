import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';

export type SyncStatus =
  | { kind: 'synced' }
  | { kind: 'pending'; count: number }
  | { kind: 'syncing' }
  | { kind: 'failed'; count: number }
  | { kind: 'conflict'; count: number };

export type SyncStatusIndicatorProps = {
  status: SyncStatus;
  onPress?: () => void;
  testID?: string;
};

function labelFor(status: SyncStatus): string {
  switch (status.kind) {
    case 'synced':
      return 'Synced';
    case 'pending':
      return `Pending ${status.count}`;
    case 'syncing':
      return 'Syncing';
    case 'failed':
      return `Failed ${status.count}`;
    case 'conflict':
      return `Conflicts ${status.count}`;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function SyncStatusIndicator({
  status,
  onPress,
  testID,
}: SyncStatusIndicatorProps): React.JSX.Element {
  const theme = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    if (status.kind !== 'syncing') {
      rotation.value = 0;
      return;
    }
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (cancelled || reduce) {
          return;
        }
        rotation.value = withRepeat(
          withTiming(360, { duration: 1000, easing: Easing.linear }),
          -1,
          false,
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [rotation, status.kind]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const color =
    status.kind === 'failed'
      ? theme.colors.sync.failed
      : status.kind === 'conflict'
        ? theme.colors.sync.conflict
        : status.kind === 'pending'
          ? theme.colors.sync.pending
          : status.kind === 'syncing'
            ? theme.colors.sync.syncing
            : theme.colors.sync.synced;

  const content = (
    <Box
      testID={testID}
      row
      align="center"
      gap={2}
      paddingX={2}
      paddingY={1}
      style={{ minHeight: 48 }}
      accessibilityRole="button"
      accessibilityLabel={labelFor(status)}
      accessibilityLiveRegion="polite"
    >
      <Animated.View style={spinStyle}>
        <Box
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: color,
          }}
        />
      </Animated.View>
      <Text variant="caption" color="secondary">
        {labelFor(status)}
      </Text>
    </Box>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={labelFor(status)}>
      {content}
    </Pressable>
  );
}

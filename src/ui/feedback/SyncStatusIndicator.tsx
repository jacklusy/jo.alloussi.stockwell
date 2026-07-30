import React, { useEffect } from 'react';
import { Pressable, AccessibilityInfo } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Icon, type IconName } from '@/ui/icons/Icon';
import { useTheme } from '@/ui/theme';
import { t } from '@/i18n';

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
      return t('sync.statusSynced');
    case 'pending':
      return `${t('sync.statusPending')} ${status.count}`;
    case 'syncing':
      return t('sync.statusSyncing');
    case 'failed':
      return `${t('sync.statusFailed')} ${status.count}`;
    case 'conflict':
      return `${t('sync.statusConflict')} ${status.count}`;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function iconFor(status: SyncStatus): IconName {
  switch (status.kind) {
    case 'synced':
      return 'check';
    case 'pending':
      return 'pending';
    case 'syncing':
      return 'sync';
    case 'failed':
      return 'failed';
    case 'conflict':
      return 'conflict';
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
  const label = labelFor(status);

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
      accessibilityLiveRegion="polite"
    >
      <Animated.View style={spinStyle}>
        <Icon name={iconFor(status)} size={18} color={color} />
      </Animated.View>
      <Text variant="caption" color="secondary">
        {label}
      </Text>
    </Box>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
    >
      {content}
    </Pressable>
  );
}

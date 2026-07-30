import React, { type ReactNode } from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  /** Sync edge rail colour — signature element. */
  syncRailColor?: string;
  accessibilityLabel?: string;
  testID?: string;
};

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron = false,
  onPress,
  syncRailColor,
  accessibilityLabel,
  testID,
}: ListRowProps): React.JSX.Element {
  const theme = useTheme();

  const content = (
    <Box
      row
      align="center"
      paddingY={3}
      paddingEnd={4}
      paddingStart={syncRailColor ? 3 : 4}
      gap={3}
      background="surfaceRaised"
      style={{ minHeight: 56, overflow: 'hidden' }}
    >
      {syncRailColor ? (
        <Box
          style={{
            width: 4,
            alignSelf: 'stretch',
            backgroundColor: syncRailColor,
            borderRadius: theme.radius.sm,
            marginEnd: theme.space[1],
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
      {leading}
      <Box flex={1} gap={1}>
        <Text variant="body" color="primary" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" color="secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Box>
      {trailing}
      {chevron ? (
        <Text variant="body" color="tertiary">
          ›
        </Text>
      ) : null}
    </Box>
  );

  if (!onPress) {
    return (
      <Box testID={testID} accessibilityLabel={accessibilityLabel ?? title}>
        {content}
      </Box>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  );
}

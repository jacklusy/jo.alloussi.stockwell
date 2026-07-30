import React from 'react';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'sync-pending'
  | 'sync-syncing'
  | 'sync-synced'
  | 'sync-failed'
  | 'sync-conflict';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  /** Icon/glyph so colour is never the sole carrier of meaning. */
  icon?: string;
  testID?: string;
};

export function Badge({
  label,
  variant = 'neutral',
  icon,
  testID,
}: BadgeProps): React.JSX.Element {
  const theme = useTheme();

  const palette: Record<BadgeVariant, { bg: string; fg: 'primary' | 'onBrand' | 'danger' | 'success' | 'warning' }> =
    {
      neutral: { bg: theme.colors.surface.surfaceSunken, fg: 'primary' },
      success: { bg: theme.colors.status.successSubtle, fg: 'success' },
      warning: { bg: theme.colors.status.warningSubtle, fg: 'warning' },
      danger: { bg: theme.colors.status.dangerSubtle, fg: 'danger' },
      info: { bg: theme.colors.status.infoSubtle, fg: 'primary' },
      'sync-pending': { bg: theme.colors.brand.primarySubtle, fg: 'warning' },
      'sync-syncing': { bg: theme.colors.status.infoSubtle, fg: 'primary' },
      'sync-synced': { bg: theme.colors.status.successSubtle, fg: 'success' },
      'sync-failed': { bg: theme.colors.status.warningSubtle, fg: 'warning' },
      'sync-conflict': { bg: theme.colors.status.dangerSubtle, fg: 'danger' },
    };

  const { bg, fg } = palette[variant];

  return (
    <Box
      testID={testID}
      row
      align="center"
      gap={1}
      paddingX={2}
      paddingY={1}
      style={{
        backgroundColor: bg,
        borderRadius: theme.radius.full,
        alignSelf: 'flex-start',
        minHeight: 24,
      }}
      accessibilityRole="text"
      accessibilityLabel={icon ? `${icon} ${label}` : label}
    >
      {icon ? (
        <Text variant="caption" color={fg}>
          {icon}
        </Text>
      ) : null}
      <Text variant="caption" color={fg}>
        {label}
      </Text>
    </Box>
  );
}

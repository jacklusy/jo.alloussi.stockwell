import React from 'react';

import { Button } from '@/ui/components/Button';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Icon, type IconName } from '@/ui/icons/Icon';
import { useTheme } from '@/ui/theme';

export type StateViewKind = 'empty' | 'error' | 'offline' | 'permission-denied';

export type StateViewProps = {
  kind: StateViewKind;
  headline: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName;
  testID?: string;
};

const defaultIcons: Record<StateViewKind, IconName> = {
  empty: 'empty',
  error: 'error',
  offline: 'offline',
  'permission-denied': 'permission',
};

export function StateView({
  kind,
  headline,
  body,
  actionLabel,
  onAction,
  icon,
  testID,
}: StateViewProps): React.JSX.Element {
  const theme = useTheme();
  const iconColor =
    kind === 'error' || kind === 'permission-denied'
      ? theme.colors.status.danger
      : kind === 'offline'
      ? theme.colors.status.warning
      : theme.colors.text.tertiary;

  return (
    <Box
      testID={testID}
      flex={1}
      align="center"
      justify="center"
      padding={6}
      gap={3}
      accessibilityRole="summary"
    >
      <Icon name={icon ?? defaultIcons[kind]} size={48} color={iconColor} />
      <Text variant="h2" align="center">
        {headline}
      </Text>
      <Text variant="body" color="secondary" align="center">
        {body}
      </Text>
      {actionLabel && onAction ? (
        <Box marginTop={4}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </Box>
      ) : null}
    </Box>
  );
}

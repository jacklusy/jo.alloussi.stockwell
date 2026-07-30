import React from 'react';

import { Button } from '@/ui/components/Button';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';

export type StateViewKind = 'empty' | 'error' | 'offline' | 'permission-denied';

export type StateViewProps = {
  kind: StateViewKind;
  headline: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  testID?: string;
};

const defaultIcons: Record<StateViewKind, string> = {
  empty: '○',
  error: '!',
  offline: '⊘',
  'permission-denied': '◌',
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
      <Text variant="display" color="tertiary">
        {icon ?? defaultIcons[kind]}
      </Text>
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

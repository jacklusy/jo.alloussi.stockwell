import React, { useState } from 'react';
import {
  TextInput,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  testID?: string;
};

export function Input({
  label,
  error,
  testID,
  editable = true,
  ...rest
}: InputProps): React.JSX.Element {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const fieldStyle: TextStyle = {
    minHeight: 48,
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[3],
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: error
      ? theme.colors.status.danger
      : focused
        ? theme.colors.border.focus
        : theme.colors.border.default,
    backgroundColor: theme.colors.surface.surfaceRaised,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    opacity: editable ? 1 : 0.5,
  };

  return (
    <Box gap={1}>
      <Text variant="label" color="secondary">
        {label}
      </Text>
      <TextInput
        {...rest}
        testID={testID}
        editable={editable}
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.text.tertiary}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={fieldStyle}
      />
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

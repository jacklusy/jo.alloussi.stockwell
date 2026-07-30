import React, { useEffect, useState } from 'react';
import { Pressable, TextInput, type TextStyle } from 'react-native';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onDebouncedChange?: (text: string) => void;
  debounceMs?: number;
  placeholder?: string;
  onCancel?: () => void;
  testID?: string;
};

export function SearchBar({
  value,
  onChangeText,
  onDebouncedChange,
  debounceMs = 300,
  placeholder = 'Search',
  onCancel,
  testID,
}: SearchBarProps): React.JSX.Element {
  const theme = useTheme();
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (!onDebouncedChange) {
      return;
    }
    const id = setTimeout(() => onDebouncedChange(local), debounceMs);
    return () => clearTimeout(id);
  }, [local, debounceMs, onDebouncedChange]);

  const fieldStyle: TextStyle = {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: theme.space[3],
    color: theme.colors.text.primary,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
  };

  return (
    <Box row align="center" gap={2}>
      <Box
        flex={1}
        row
        align="center"
        paddingX={2}
        background="surfaceRaised"
        radius="md"
        border="default"
        style={{ minHeight: 48 }}
      >
        <TextInput
          testID={testID}
          value={local}
          onChangeText={(t) => {
            setLocal(t);
            onChangeText(t);
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          accessibilityLabel={placeholder}
          accessibilityRole="search"
          returnKeyType="search"
          clearButtonMode="never"
          style={fieldStyle}
        />
        {local.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => {
              setLocal('');
              onChangeText('');
              onDebouncedChange?.('');
            }}
            hitSlop={8}
            style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text variant="body" color="secondary">
              ✕
            </Text>
          </Pressable>
        ) : null}
      </Box>
      {onCancel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
          onPress={onCancel}
          style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: theme.space[2] }}
        >
          <Text variant="body" color="secondary">
            Cancel
          </Text>
        </Pressable>
      ) : null}
    </Box>
  );
}

import React, { useCallback, useState } from 'react';
import { Pressable, TextInput, type ViewStyle } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { useTheme } from '@/ui/theme';

export type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  testID?: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function QuantityStepper({
  value,
  onChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  disabled = false,
  testID,
}: QuantityStepperProps): React.JSX.Element {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = useCallback(
    (next: number) => {
      const clamped = clamp(next, min, max);
      onChange(clamped);
      setDraft(String(clamped));
    },
    [max, min, onChange],
  );

  const bump = useCallback(
    (delta: number) => {
      if (disabled) {
        return;
      }
      ReactNativeHapticFeedback.trigger('impactLight');
      commit(value + delta);
    },
    [commit, disabled, value],
  );

  const hitStyle: ViewStyle = {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface.surfaceSunken,
    opacity: disabled ? 0.4 : 1,
  };

  return (
    <Box testID={testID} row align="center" gap={2}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease by one"
        accessibilityState={{ disabled }}
        disabled={disabled || value <= min}
        onPress={() => bump(-step)}
        style={hitStyle}
      >
        <Text variant="h2" color="primary">
          −
        </Text>
      </Pressable>

      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={() => {
            setEditing(false);
            const parsed = Number(draft);
            if (Number.isFinite(parsed)) {
              commit(parsed);
            } else {
              setDraft(String(value));
            }
          }}
          keyboardType="numeric"
          selectTextOnFocus
          accessibilityLabel="Quantity"
          style={{
            minWidth: 72,
            minHeight: 48,
            textAlign: 'center',
            color: theme.colors.text.primary,
            fontFamily: theme.typography.numeric.fontFamily,
            fontSize: theme.typography.numeric.fontSize,
            borderBottomWidth: 2,
            borderBottomColor: theme.colors.border.focus,
          }}
        />
      ) : (
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel={`Quantity ${value}`}
          accessibilityLiveRegion="polite"
          disabled={disabled}
          onPress={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          style={{ minWidth: 72, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text variant="numeric" color="primary">
            {value}
          </Text>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase by one"
        accessibilityState={{ disabled }}
        disabled={disabled || value >= max}
        onPress={() => bump(step)}
        style={hitStyle}
      >
        <Text variant="h2" color="primary">
          +
        </Text>
      </Pressable>
    </Box>
  );
}

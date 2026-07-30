import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { Button } from '@/ui/components/Button';
import { ThemeProvider } from '@/ui/theme';

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Button', () => {
  it('fires onPress when enabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = wrap(<Button label="Save" onPress={onPress} testID="btn" />);
    fireEvent.press(getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = wrap(<Button label="Save" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

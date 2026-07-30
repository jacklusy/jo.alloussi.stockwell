import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { QuantityStepper } from '@/ui/components/QuantityStepper';
import { ThemeProvider } from '@/ui/theme';

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('QuantityStepper', () => {
  it('increments and decrements', () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <QuantityStepper value={5} onChange={onChange} testID="stepper" />,
    );
    fireEvent.press(getByLabelText('Increase by one'));
    expect(onChange).toHaveBeenCalledWith(6);
    fireEvent.press(getByLabelText('Decrease by one'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('respects disabled', () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <QuantityStepper value={5} onChange={onChange} disabled />,
    );
    fireEvent.press(getByLabelText('Increase by one'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

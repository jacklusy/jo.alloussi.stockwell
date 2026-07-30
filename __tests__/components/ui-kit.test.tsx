import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { Input } from '@/ui/components/Input';
import { ListRow } from '@/ui/components/ListRow';
import { Badge } from '@/ui/components/Badge';
import { IconButton } from '@/ui/components/IconButton';
import { SearchBar } from '@/ui/components/SearchBar';
import { Card } from '@/ui/components/Card';
import { Text } from '@/ui/primitives/Text';
import { StateView } from '@/ui/feedback/StateView';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { ThemeProvider } from '@/ui/theme';

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Input', () => {
  it('shows label and error', () => {
    const { getByText } = wrap(<Input label="Email" error="Required" testID="email" />);
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Required')).toBeTruthy();
  });

  it('is not editable when disabled', () => {
    const { getByTestId } = wrap(<Input label="Email" editable={false} testID="email" />);
    expect(getByTestId('email').props.editable).toBe(false);
  });
});

describe('ListRow', () => {
  it('invokes onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = wrap(<ListRow title="SKU-1" onPress={onPress} testID="row" />);
    fireEvent.press(getByTestId('row'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Badge', () => {
  it('renders label with sync icon meaning', () => {
    const { getByLabelText } = wrap(
      <Badge label="Pending" variant="sync-pending" icon="●" testID="badge" />,
    );
    expect(getByLabelText('● Pending')).toBeTruthy();
  });
});

describe('IconButton', () => {
  it('requires accessibility label and fires press', () => {
    const onPress = jest.fn();
    const { getByLabelText } = wrap(
      <IconButton icon="⚙" accessibilityLabel="Open settings" onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Open settings'));
    expect(onPress).toHaveBeenCalled();
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    const { getByLabelText } = wrap(
      <IconButton icon="⚙" accessibilityLabel="Open settings" onPress={onPress} disabled />,
    );
    fireEvent.press(getByLabelText('Open settings'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('SearchBar', () => {
  it('clears value', () => {
    const onChange = jest.fn();
    const { getByLabelText } = wrap(
      <SearchBar value="bolt" onChangeText={onChange} testID="search" />,
    );
    fireEvent.press(getByLabelText('Clear search'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});

describe('Card', () => {
  it('renders compound slots', () => {
    const { getByText } = wrap(
      <Card testID="card">
        <Card.Header>
          <Text>Header</Text>
        </Card.Header>
        <Card.Body>
          <Text>Body</Text>
        </Card.Body>
      </Card>,
    );
    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Body')).toBeTruthy();
  });
});

describe('StateView', () => {
  it('renders action when provided', () => {
    const onAction = jest.fn();
    const { getByLabelText } = wrap(
      <StateView
        kind="error"
        headline="Failed"
        body="Try again"
        actionLabel="Retry"
        onAction={onAction}
      />,
    );
    fireEvent.press(getByLabelText('Retry'));
    expect(onAction).toHaveBeenCalled();
  });
});

describe('Skeleton', () => {
  it('exposes loading progress role', () => {
    const { getByLabelText } = wrap(<Skeleton width={100} height={20} testID="sk" />);
    expect(getByLabelText('Loading')).toBeTruthy();
  });
});

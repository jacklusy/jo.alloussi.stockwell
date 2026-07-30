/**
 * @format
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { App } from '../src/app/App';

jest.mock('@/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

test('App renders providers', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

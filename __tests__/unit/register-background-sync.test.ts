import { AppRegistry, Platform } from 'react-native';

import { container, TOKENS } from '@/core/di';
import {
  BACKGROUND_SYNC_TASK,
  registerBackgroundSyncTask,
  resetBackgroundSyncRegistrationForTests,
} from '@/sync/background/register-background-sync';

describe('registerBackgroundSyncTask', () => {
  afterEach(() => {
    resetBackgroundSyncRegistrationForTests();
    jest.restoreAllMocks();
  });

  it('registers the Headless JS task on Android once and runs the engine', async () => {
    const register = jest.spyOn(AppRegistry, 'registerHeadlessTask').mockImplementation(jest.fn());
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });

    const engine = {
      boot: jest.fn(async () => undefined),
      run: jest.fn(async () => undefined),
    };
    jest.spyOn(container, 'resolve').mockImplementation((token) => {
      if (token === TOKENS.SYNC_ENGINE) {
        return engine;
      }
      throw new Error('unexpected token');
    });

    registerBackgroundSyncTask();
    registerBackgroundSyncTask();
    expect(register).toHaveBeenCalledTimes(1);
    expect(register.mock.calls[0]?.[0]).toBe(BACKGROUND_SYNC_TASK);

    const factory = register.mock.calls[0]?.[1] as () => () => Promise<void>;
    await factory()();
    expect(engine.run).toHaveBeenCalledWith('background');
  });

  it('is a no-op on iOS', () => {
    const register = jest.spyOn(AppRegistry, 'registerHeadlessTask').mockImplementation(jest.fn());
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    registerBackgroundSyncTask();
    expect(register).not.toHaveBeenCalled();
  });
});

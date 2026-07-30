import { runBackgroundSync } from '@/sync/background/run-background-sync';
import type { SyncEngine } from '@/sync/engine/sync-engine';

describe('runBackgroundSync', () => {
  it('boots then runs with background reason', async () => {
    const engine = {
      boot: jest.fn(async () => undefined),
      run: jest.fn(async () => undefined),
    } as unknown as SyncEngine;
    await runBackgroundSync(engine);
    expect(engine.boot).toHaveBeenCalled();
    expect(engine.run).toHaveBeenCalledWith('background');
  });

  it('rethrows when the engine fails', async () => {
    const engine = {
      boot: jest.fn(async () => undefined),
      run: jest.fn(async () => {
        throw new Error('nope');
      }),
    } as unknown as SyncEngine;
    await expect(runBackgroundSync(engine)).rejects.toThrow('nope');
  });
});

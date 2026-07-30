import { MutationQueue } from '@/sync/queue/mutation-queue';
import { DeltaBuffer } from '@/sync/realtime/delta-buffer';
import { StockDeltaSocket } from '@/sync/realtime/stock-delta-socket';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';

type Handler = ((ev: { data: string }) => void) | null;

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: Handler = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  close(): void {
    this.onclose?.();
  }

  open(): void {
    this.onopen?.();
  }

  emit(data: string): void {
    this.onmessage?.({ data });
  }
}

describe('StockDeltaSocket', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does nothing when url is empty', () => {
    const db = createSyncMemoryDb();
    const socket = new StockDeltaSocket({
      url: '',
      db,
      queue: new MutationQueue(db),
      buffer: new DeltaBuffer(),
      getAccessToken: async () => 'tok',
      onReconnect: async () => undefined,
      webSocketFactory: FakeWebSocket as unknown as typeof WebSocket,
    });
    socket.start();
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it('applies stock.balance.updated when queue is clear', async () => {
    const db = createSyncMemoryDb();
    await db.execute(
      `INSERT INTO stock_balances (id, tenant_id, warehouse_id, location_id, product_id, on_hand, reserved, version, pending_sync, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['b1', 't1', 'wh1', 'loc1', 'p1', 1, 0, 1, 0, 1],
    );
    const onReconnect = jest.fn(async () => undefined);
    const socket = new StockDeltaSocket({
      url: 'ws://localhost/ws',
      db,
      queue: new MutationQueue(db),
      buffer: new DeltaBuffer(),
      getAccessToken: async () => 'secret',
      onReconnect,
      webSocketFactory: FakeWebSocket as unknown as typeof WebSocket,
    });
    socket.start();
    await Promise.resolve();
    expect(FakeWebSocket.instances[0]?.url).toContain('access_token=secret');
    FakeWebSocket.instances[0]?.open();
    FakeWebSocket.instances[0]?.emit(
      JSON.stringify({
        type: 'stock.balance.updated',
        payload: {
          balanceId: 'b1',
          onHand: 8,
          reserved: 0,
          version: 2,
          updatedAt: 50,
        },
      }),
    );
    await Promise.resolve();
    await Promise.resolve();
    const row = (await db.execute(`SELECT * FROM stock_balances WHERE id = ?`, ['b1'])).rows[0] as {
      on_hand: number;
    };
    expect(row.on_hand).toBe(8);
    expect(onReconnect).not.toHaveBeenCalled();
  });

  it('triggers onReconnect after a subsequent open', async () => {
    const db = createSyncMemoryDb();
    const onReconnect = jest.fn(async () => undefined);
    const socket = new StockDeltaSocket({
      url: 'ws://localhost/ws',
      db,
      queue: new MutationQueue(db),
      buffer: new DeltaBuffer(),
      getAccessToken: async () => 't',
      onReconnect,
      webSocketFactory: FakeWebSocket as unknown as typeof WebSocket,
    });
    socket.start();
    await Promise.resolve();
    FakeWebSocket.instances[0]?.open();
    FakeWebSocket.instances[0]?.close();
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    FakeWebSocket.instances[1]?.open();
    expect(onReconnect).toHaveBeenCalled();
    expect(await socket.flush()).toBe(0);
    socket.stop();
  });

  it('ignores invalid payloads and retries when token is missing', async () => {
    const db = createSyncMemoryDb();
    let token: string | null = null;
    const socket = new StockDeltaSocket({
      url: 'ws://localhost/ws',
      db,
      queue: new MutationQueue(db),
      buffer: new DeltaBuffer(),
      getAccessToken: async () => token,
      onReconnect: async () => undefined,
      webSocketFactory: FakeWebSocket as unknown as typeof WebSocket,
    });
    socket.start();
    await Promise.resolve();
    expect(FakeWebSocket.instances).toHaveLength(0);
    token = 'now';
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    expect(FakeWebSocket.instances.length).toBeGreaterThan(0);
    FakeWebSocket.instances[0]?.open();
    FakeWebSocket.instances[0]?.emit('not-json');
    FakeWebSocket.instances[0]?.emit(JSON.stringify({ type: 'other.event' }));
    FakeWebSocket.instances[0]?.emit(
      JSON.stringify({ type: 'stock.balance.updated', payload: { balanceId: '' } }),
    );
    socket.stop();
  });
});

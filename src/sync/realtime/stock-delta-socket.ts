import { z } from 'zod';

import { logger } from '@/services/logging/logger';
import { computeBackoffMs } from '@/sync/engine/backoff';
import {
  applyOrBufferStockDelta,
  flushBufferedStockDeltas,
  type ApplyStockDeltaDeps,
} from '@/sync/realtime/apply-stock-delta';
import { stockBalanceUpdatedSchema } from '@/sync/realtime/types';

const CONNECT_BASE_ATTEMPTS = 0;

export type StockDeltaSocketDeps = ApplyStockDeltaDeps & {
  /** Empty / undefined disables the socket (default). */
  url: string | null | undefined;
  getAccessToken: () => Promise<string | null>;
  /** Called after a successful (re)connect so missed events are recovered via pull. */
  onReconnect: () => Promise<void>;
  /** Injected for tests. */
  webSocketFactory?: typeof WebSocket;
};

/**
 * Optional live stock deltas (doc 15 §9 / ADR-M007).
 * Disabled when `url` is empty. Uses the platform WebSocket — no extra native dep.
 */
export class StockDeltaSocket {
  private socket: WebSocket | null = null;
  private stopped = false;
  private attempts = CONNECT_BASE_ATTEMPTS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private everOpened = false;

  constructor(private readonly deps: StockDeltaSocketDeps) {}

  start(): void {
    if (!this.deps.url) {
      return;
    }
    this.stopped = false;
    void this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  /** Exposed for SyncEngine afterCycle. */
  async flush(): Promise<number> {
    return flushBufferedStockDeltas(this.deps);
  }

  private async connect(): Promise<void> {
    if (this.stopped || !this.deps.url) {
      return;
    }
    const token = await this.deps.getAccessToken();
    if (!token) {
      this.scheduleReconnect();
      return;
    }

    const separator = this.deps.url.includes('?') ? '&' : '?';
    const url = `${this.deps.url}${separator}access_token=${encodeURIComponent(token)}`;
    const Factory = this.deps.webSocketFactory ?? WebSocket;

    try {
      this.socket = new Factory(url);
    } catch (error) {
      logger.warn('WebSocket construct failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.attempts = CONNECT_BASE_ATTEMPTS;
      const isReconnect = this.everOpened;
      this.everOpened = true;
      if (isReconnect) {
        void this.deps.onReconnect().catch((error: unknown) => {
          logger.warn('WS reconnect pull failed', {
            reason: error instanceof Error ? error.message : 'unknown',
          });
        });
      }
    };

    this.socket.onmessage = (event) => {
      void this.handleMessage(String(event.data));
    };

    this.socket.onerror = () => {
      logger.warn('WebSocket error');
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (!this.stopped) {
        this.scheduleReconnect();
      }
    };
  }

  private async handleMessage(raw: string): Promise<void> {
    let json: unknown;
    try {
      json = JSON.parse(raw) as unknown;
    } catch {
      return;
    }

    const envelope = z
      .object({ type: z.string() })
      .passthrough()
      .safeParse(json);
    if (!envelope.success || envelope.data.type !== 'stock.balance.updated') {
      return;
    }

    const parsed = stockBalanceUpdatedSchema.safeParse(json);
    if (!parsed.success) {
      logger.warn('Invalid stock.balance.updated payload');
      return;
    }

    const result = await applyOrBufferStockDelta(this.deps, parsed.data.payload);
    logger.info('Live stock delta', { result, balanceId: parsed.data.payload.balanceId });
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) {
      return;
    }
    this.attempts += 1;
    const delay = Math.max(0, computeBackoffMs(this.attempts) - Date.now());
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }
}

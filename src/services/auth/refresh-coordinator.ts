import type { TokenPair } from '@/storage/secure/keychain';
import { loadTokens, saveTokens } from '@/storage/secure/keychain';
import { logger } from '@/services/logging/logger';

type RefreshFn = (refreshToken: string) => Promise<TokenPair>;

/**
 * Single-flight refresh mutex.
 * Five concurrent 401s share one in-flight refresh promise.
 */
export class RefreshCoordinator {
  private inFlight: Promise<TokenPair> | null = null;
  private refreshFn: RefreshFn | null = null;

  configure(refreshFn: RefreshFn): void {
    this.refreshFn = refreshFn;
  }

  async refresh(): Promise<TokenPair> {
    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = this.runRefresh().finally(() => {
      this.inFlight = null;
    });

    return this.inFlight;
  }

  /** Exposed for tests — true while a refresh is in flight. */
  get isRefreshing(): boolean {
    return this.inFlight !== null;
  }

  private async runRefresh(): Promise<TokenPair> {
    if (!this.refreshFn) {
      throw new Error('RefreshCoordinator not configured');
    }
    const existing = await loadTokens();
    if (!existing?.refreshToken) {
      throw new Error('No refresh token');
    }
    logger.info('Refreshing access token');
    const next = await this.refreshFn(existing.refreshToken);
    await saveTokens(next);
    return next;
  }
}

export const refreshCoordinator = new RefreshCoordinator();

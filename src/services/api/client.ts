import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { AuthError } from '@/core/errors';
import { createId } from '@/core/utils/id';
import { appConfig } from '@/services/api/config';
import { mapAxiosError } from '@/services/api/error-mapper';
import { refreshCoordinator } from '@/services/auth/refresh-coordinator';
import { useSessionStore } from '@/services/auth/session-store';
import { loadTokens } from '@/storage/secure/keychain';

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

type RetryConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
  _retriedAfterRefresh?: boolean;
  idempotencyKey?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  const base = Math.min(1000 * 2 ** attempt, 8000);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

function shouldRetry(error: AxiosError, _config: RetryConfig): boolean {
  const status = error.response?.status;
  if (status === 429) {
    return true;
  }
  if (status !== undefined && status < 500) {
    return false;
  }
  // Network / timeout / 5xx
  return true;
}

export type CreateClientOptions = {
  baseURL?: string;
  getAccessToken?: () => Promise<string | null>;
  getTenantId?: () => string | null;
};

export function createApiClient(options: CreateClientOptions = {}): AxiosInstance {
  const client = axios.create({
    baseURL: options.baseURL ?? appConfig.apiBaseUrl,
    timeout: TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  const getAccessToken =
    options.getAccessToken ??
    (async () => {
      const tokens = await loadTokens();
      return tokens?.accessToken ?? null;
    });

  const getTenantId = options.getTenantId ?? (() => useSessionStore.getState().tenantId);

  client.interceptors.request.use(async (config: RetryConfig) => {
    config.headers = config.headers ?? {};
    config.headers['X-Correlation-Id'] = createId();

    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = getTenantId();
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }

    const method = (config.method ?? 'get').toLowerCase();
    if ((method === 'post' || method === 'patch') && config.idempotencyKey) {
      config.headers['Idempotency-Key'] = config.idempotencyKey;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = (error.config ?? {}) as RetryConfig;
      const status = error.response?.status;

      if (status === 401 && !config._retriedAfterRefresh) {
        try {
          const tokens = await refreshCoordinator.refresh();
          config._retriedAfterRefresh = true;
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return client.request(config);
        } catch {
          throw new AuthError();
        }
      }

      const retryCount = config._retryCount ?? 0;
      if (shouldRetry(error, config) && retryCount < MAX_RETRIES) {
        if (status === 429) {
          const retryAfter = error.response?.headers?.['retry-after'];
          const wait = retryAfter ? Number(retryAfter) * 1000 : backoffMs(retryCount);
          await sleep(Number.isFinite(wait) ? wait : backoffMs(retryCount));
        } else {
          await sleep(backoffMs(retryCount));
        }
        config._retryCount = retryCount + 1;
        return client.request(config);
      }

      throw mapAxiosError(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();

export type { AxiosRequestConfig };

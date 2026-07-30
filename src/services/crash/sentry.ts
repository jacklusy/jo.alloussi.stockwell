import * as Sentry from '@sentry/react-native';

import { appConfig } from '@/services/api/config';
import { logger } from '@/services/logging/logger';

const APP_RELEASE = 'jo.alloussi.stockwell@0.0.1';

const PII_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'email',
  'phone',
  'Authorization',
] as const;

function scrubValue(key: string, value: unknown): unknown {
  if (PII_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
    return '[Filtered]';
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return scrubRecord(value as Record<string, unknown>);
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => scrubValue(String(index), item));
  }
  return value;
}

function scrubRecord(record: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    next[key] = scrubValue(key, value);
  }
  return next;
}

/** Scrub PII from Sentry events — never ship tokens/passwords/email. */
export function scrubSentryEvent<T extends Record<string, unknown>>(event: T): T {
  const clone = { ...event } as Record<string, unknown>;
  if (clone.request && typeof clone.request === 'object') {
    clone.request = scrubRecord(clone.request as Record<string, unknown>);
  }
  if (clone.user && typeof clone.user === 'object') {
    const user = { ...(clone.user as Record<string, unknown>) };
    delete user.email;
    delete user.ip_address;
    clone.user = user;
  }
  if (clone.extra && typeof clone.extra === 'object') {
    clone.extra = scrubRecord(clone.extra as Record<string, unknown>);
  }
  if (clone.contexts && typeof clone.contexts === 'object') {
    clone.contexts = scrubRecord(clone.contexts as Record<string, unknown>);
  }
  return clone as T;
}

let initialised = false;

/**
 * Initialise Sentry once at bootstrap. No-ops when DSN is empty (local/tests).
 */
export function initCrashReporting(): void {
  if (initialised) {
    return;
  }
  initialised = true;

  if (!appConfig.sentryDsn) {
    logger.info('Sentry disabled — empty DSN');
    return;
  }

  Sentry.init({
    dsn: appConfig.sentryDsn,
    environment: appConfig.env,
    release: APP_RELEASE,
    tracesSampleRate: appConfig.env === 'production' ? 0.2 : 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      return scrubSentryEvent(
        event as unknown as Record<string, unknown>,
      ) as unknown as typeof event;
    },
  });
}

export function captureUnexpectedError(error: unknown, context?: Record<string, unknown>): void {
  if (!appConfig.sentryDsn) {
    logger.error('Unexpected error (Sentry off)', {
      reason: error instanceof Error ? error.message : 'unknown',
      ...context,
    });
    return;
  }
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(scrubRecord(context));
    }
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error));
    }
  });
}

export { Sentry };

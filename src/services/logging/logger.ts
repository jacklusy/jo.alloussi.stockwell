export type Logger = {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
};

const REDACT_KEYS = /token|password|authorization|secret|refresh|access/i;

function redact(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    out[key] = REDACT_KEYS.test(key) ? '[redacted]' : value;
  }
  return out;
}

/** Single logger — console stripped in release via babel plugin. */
export const logger: Logger = {
  debug: (message, context) => {
    // eslint-disable-next-line no-console
    console.debug(message, redact(context));
  },
  info: (message, context) => {
    // eslint-disable-next-line no-console
    console.info(message, redact(context));
  },
  warn: (message, context) => {
    // eslint-disable-next-line no-console
    console.warn(message, redact(context));
  },
  error: (message, context) => {
    // eslint-disable-next-line no-console
    console.error(message, redact(context));
  },
};

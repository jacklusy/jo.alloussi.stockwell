import { scrubSentryEvent } from '@/services/crash/sentry';

describe('Sentry beforeSend scrub (M-29)', () => {
  it('redacts tokens, passwords, and email from event payloads', () => {
    const scrubbed = scrubSentryEvent({
      request: {
        headers: { Authorization: 'Bearer secret-token', Accept: 'application/json' },
        data: { password: 'hunter2', sku: 'ABC' },
      },
      user: { id: 'u1', email: 'op@warehouse.test', ip_address: '1.2.3.4' },
      extra: { accessToken: 'abc', note: 'safe' },
    });

    expect(scrubbed.request).toEqual({
      headers: { Authorization: '[Filtered]', Accept: 'application/json' },
      data: { password: '[Filtered]', sku: 'ABC' },
    });
    expect(scrubbed.user).toEqual({ id: 'u1' });
    expect(scrubbed.extra).toEqual({ accessToken: '[Filtered]', note: 'safe' });
  });
});

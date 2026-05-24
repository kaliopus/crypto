import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSignedAuthTokenForTests, getCurrentUserId } from '@/lib/auth';

const userId = '00000000-0000-4000-8000-00000000000a';

describe('auth boundary', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts development header auth outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const headers = new Headers({ 'x-risk-sentinel-user-id': userId });

    expect(getCurrentUserId(headers)).toBe(userId);
  });

  it('rejects forged user headers in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', 'test-secret');

    const headers = new Headers({ 'x-risk-sentinel-user-id': userId });

    expect(getCurrentUserId(headers)).toBeNull();
  });

  it('accepts signed auth cookies in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', 'test-secret');
    const token = createSignedAuthTokenForTests(userId, 'test-secret');

    const headers = new Headers({ cookie: `risk_sentinel_auth=${encodeURIComponent(token)}` });

    expect(getCurrentUserId(headers)).toBe(userId);
  });

  it('rejects unsigned dev cookies in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', 'test-secret');

    const headers = new Headers({ cookie: `risk_sentinel_user_id=${userId}` });

    expect(getCurrentUserId(headers)).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { __resetRateLimitForTests, checkRateLimit } from '@/lib/security/rateLimit';

describe('rate limiting', () => {
  afterEach(() => {
    __resetRateLimitForTests();
    vi.unstubAllEnvs();
  });

  it('fails closed in production when distributed rate limiting is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const result = await checkRateLimit(new Request('http://localhost/api/check'), {
      key: 'api-check',
      limit: 30,
      windowMs: 60_000
    });

    expect(result).toMatchObject({ allowed: false, misconfigured: true });
  });

  it('allows in-memory limiting in test mode', async () => {
    vi.stubEnv('NODE_ENV', 'test');

    const result = await checkRateLimit(new Request('http://localhost/api/check'), {
      key: 'api-check',
      limit: 1,
      windowMs: 60_000
    });

    expect(result).toMatchObject({ allowed: true, misconfigured: false });
  });
});

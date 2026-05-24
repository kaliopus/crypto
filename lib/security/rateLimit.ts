import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@/lib/config';

type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
  userId?: string | null;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const MILLISECONDS_PER_SECOND = 1000;
const TOO_MANY_REQUESTS_STATUS = 429;
const MISCONFIGURED_STATUS = 503;

const buckets = new Map<string, Bucket>();
const distributedLimiters = new Map<string, Ratelimit>();
let redisClient: Redis | null = null;

function clientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || request.headers.get('x-real-ip') || 'local';
}

function subjectFor(request: Request, rule: RateLimitRule) {
  return rule.userId ? `user:${rule.userId}` : `ip:${clientIp(request)}`;
}

function getRedisClient() {
  if (!env.upstashRedisRestUrl || !env.upstashRedisRestToken) return null;
  redisClient ??= new Redis({
    url: env.upstashRedisRestUrl,
    token: env.upstashRedisRestToken
  });
  return redisClient;
}

function getDistributedLimiter(rule: RateLimitRule) {
  const redis = getRedisClient();
  if (!redis) return null;

  const limiterKey = `${rule.key}:${rule.limit}:${rule.windowMs}`;
  const existing = distributedLimiters.get(limiterKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(rule.limit, `${Math.ceil(rule.windowMs / MILLISECONDS_PER_SECOND)} s`),
    analytics: false,
    prefix: `risk-sentinel:${rule.key}`
  });
  distributedLimiters.set(limiterKey, limiter);
  return limiter;
}

function checkInMemoryRateLimit(request: Request, rule: RateLimitRule) {
  const now = Date.now();
  const subject = subjectFor(request, rule);
  const bucketKey = `${rule.key}:${subject}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, remaining: rule.limit - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= rule.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / MILLISECONDS_PER_SECOND))
    };
  }

  current.count += 1;
  return { allowed: true, remaining: rule.limit - current.count, retryAfterSeconds: 0 };
}

export async function checkRateLimit(request: Request, rule: RateLimitRule) {
  const limiter = getDistributedLimiter(rule);
  if (limiter) {
    const result = await limiter.limit(subjectFor(request, rule));
    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfterSeconds: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / MILLISECONDS_PER_SECOND)),
      misconfigured: false
    };
  }

  if (env.allowMemoryDb) return { ...checkInMemoryRateLimit(request, rule), misconfigured: false };

  return { allowed: false, remaining: 0, retryAfterSeconds: 0, misconfigured: true };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { ok: false, error: 'Too many requests.' },
    {
      status: TOO_MANY_REQUESTS_STATUS,
      headers: {
        'retry-after': retryAfterSeconds.toString()
      }
    }
  );
}

export function rateLimitMisconfiguredResponse() {
  return Response.json({ ok: false, error: 'Rate limiting is not configured.' }, { status: MISCONFIGURED_STATUS });
}

export function __resetRateLimitForTests() {
  buckets.clear();
  distributedLimiters.clear();
  redisClient = null;
}

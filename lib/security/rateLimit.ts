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

const buckets = new Map<string, Bucket>();

function clientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || request.headers.get('x-real-ip') || 'local';
}

export function checkRateLimit(request: Request, rule: RateLimitRule) {
  const now = Date.now();
  const subject = rule.userId ? `user:${rule.userId}` : `ip:${clientIp(request)}`;
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

export function __resetRateLimitForTests() {
  buckets.clear();
}

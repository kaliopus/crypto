import { env, requireCronSecret } from './config';

const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID_HEADER = 'x-risk-sentinel-user-id';
const USER_ID_COOKIE = 'risk_sentinel_user_id';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertCronAuthorization(authHeader: string | null) {
  let expectedSecret: string;
  try {
    expectedSecret = requireCronSecret();
  } catch {
    return false;
  }
  const expected = `Bearer ${expectedSecret}`;
  if (!authHeader || authHeader !== expected) {
    return false;
  }
  return true;
}

function parseCookie(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return null;
  const item = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));
  return item ? decodeURIComponent(item.slice(key.length + 1)) : null;
}

function normalizeUserId(value?: string | null) {
  if (!value) return null;
  return uuidPattern.test(value) ? value : null;
}

export function getCurrentUserId(headers: Pick<Headers, 'get'>) {
  const headerUserId = normalizeUserId(headers.get(USER_ID_HEADER));
  if (headerUserId) return headerUserId;

  const cookieUserId = normalizeUserId(parseCookie(headers.get('cookie'), USER_ID_COOKIE));
  if (cookieUserId) return cookieUserId;

  const devUserId = normalizeUserId(env.devUserId);
  if (devUserId) return devUserId;

  if (process.env.NODE_ENV === 'test') return TEST_USER_ID;

  return null;
}

export function requireCurrentUserId(headers: Pick<Headers, 'get'>) {
  const userId = getCurrentUserId(headers);
  if (!userId) {
    throw new Error('User authentication is required.');
  }
  return userId;
}

import { requireCronSecret } from './config';

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

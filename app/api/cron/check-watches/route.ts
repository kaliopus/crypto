export const runtime = 'nodejs';

import { assertCronAuthorization } from '@/lib/auth';
import { checkDueWatches } from '@/lib/workers/checkWatches';

export async function GET(request: Request) {
  if (!assertCronAuthorization(request.headers.get('authorization'))) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const summary = await checkDueWatches();
  return Response.json({ ok: true, ...summary });
}

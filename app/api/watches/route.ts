export const runtime = 'nodejs';

import { checkPositionRisk } from '@/lib/risk/engine';
import { serializePositionRisk } from '@/lib/risk/format';
import { createWatch, listWatches, storeRiskSnapshot } from '@/lib/db/repository';
import { createWatchSchema } from '@/lib/validation/schemas';
import { getCurrentUserId } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

function serializeSnapshot(snapshot: Awaited<ReturnType<typeof storeRiskSnapshot>>) {
  return {
    ...snapshot,
    blockNumber: snapshot.blockNumber?.toString() ?? null,
    createdAt: snapshot.createdAt.toISOString()
  };
}

export async function GET(request: Request) {
  const userId = getCurrentUserId(request.headers);
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const watches = await listWatches(userId);
  return Response.json({ ok: true, data: watches });
}

export async function POST(request: Request) {
  const userId = getCurrentUserId(request.headers);
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const rateLimit = checkRateLimit(request, { key: 'api-watches-create', limit: 5, windowMs: 60_000, userId });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);

  const body = await request.json().catch(() => null);
  const parsed = createWatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const watch = await createWatch({
    ...parsed.data,
    userId,
    minHealthFactor: parsed.data.minHealthFactor.toString(),
    targetHealthFactor: parsed.data.targetHealthFactor.toString(),
    telegramChatId: parsed.data.telegramChatId || null
  });
  const risk = await checkPositionRisk({
    protocolKey: 'aave-v3',
    chainKey: watch.chainKey,
    walletAddress: watch.walletAddress as `0x${string}`,
    targetHealthFactor: Number(watch.targetHealthFactor)
  });
  const snapshot = await storeRiskSnapshot(watch.id, risk);

  return Response.json({ ok: true, data: { watch, snapshot: serializeSnapshot(snapshot), risk: serializePositionRisk(risk) } }, { status: 201 });
}

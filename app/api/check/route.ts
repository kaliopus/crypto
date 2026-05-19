export const runtime = 'nodejs';

import { checkPositionRisk } from '@/lib/risk/engine';
import { serializePositionRisk } from '@/lib/risk/format';
import { checkQuerySchema } from '@/lib/validation/schemas';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = checkQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const risk = await checkPositionRisk({
    protocolKey: parsed.data.protocol,
    chainKey: parsed.data.chain,
    walletAddress: parsed.data.wallet as `0x${string}`,
    targetHealthFactor: parsed.data.targetHealthFactor
  });

  return Response.json({ ok: true, data: serializePositionRisk(risk) });
}

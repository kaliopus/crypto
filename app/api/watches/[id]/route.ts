export const runtime = 'nodejs';

import { getWatch, updateWatch } from '@/lib/db/repository';
import { updateWatchSchema } from '@/lib/validation/schemas';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateWatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const existing = await getWatch(id);
  if (!existing) {
    return Response.json({ ok: false, error: 'Watch not found.' }, { status: 404 });
  }
  const watch = await updateWatch(id, {
    ...parsed.data,
    telegramChatId: parsed.data.telegramChatId || null,
    minHealthFactor: parsed.data.minHealthFactor?.toString(),
    targetHealthFactor: parsed.data.targetHealthFactor?.toString()
  });
  return Response.json({ ok: true, data: watch });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const watch = await updateWatch(id, { isActive: false });
  if (!watch) {
    return Response.json({ ok: false, error: 'Watch not found.' }, { status: 404 });
  }
  return Response.json({ ok: true, data: watch });
}

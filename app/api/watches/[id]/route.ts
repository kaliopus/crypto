export const runtime = 'nodejs';

import { getWatch, updateWatch } from '@/lib/db/repository';
import { updateWatchSchema } from '@/lib/validation/schemas';
import { getCurrentUserId } from '@/lib/auth';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = getCurrentUserId(request.headers);
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateWatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const existing = await getWatch(id, userId);
  if (!existing) {
    return Response.json({ ok: false, error: 'Watch not found.' }, { status: 404 });
  }
  const watch = await updateWatch(id, {
    ...parsed.data,
    telegramChatId: parsed.data.telegramChatId || null,
    minHealthFactor: parsed.data.minHealthFactor?.toString(),
    targetHealthFactor: parsed.data.targetHealthFactor?.toString()
  }, userId);
  return Response.json({ ok: true, data: watch });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = getCurrentUserId(request.headers);
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const { id } = await context.params;
  const watch = await updateWatch(id, { isActive: false }, userId);
  if (!watch) {
    return Response.json({ ok: false, error: 'Watch not found.' }, { status: 404 });
  }
  return Response.json({ ok: true, data: watch });
}

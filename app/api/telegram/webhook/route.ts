export const runtime = 'nodejs';

import { env } from '@/lib/config';

const UNAUTHORIZED_STATUS = 401;
const MISCONFIGURED_STATUS = 503;

function isTelegramWebhookAuthorized(request: Request) {
  if (!env.telegramWebhookSecret) return env.allowMemoryDb;
  return request.headers.get('x-telegram-bot-api-secret-token') === env.telegramWebhookSecret;
}

export async function POST(request: Request) {
  if (!env.telegramWebhookSecret && !env.allowMemoryDb) {
    return Response.json({ ok: false, error: 'TELEGRAM_WEBHOOK_SECRET is required.' }, { status: MISCONFIGURED_STATUS });
  }
  if (!isTelegramWebhookAuthorized(request)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: UNAUTHORIZED_STATUS });
  }

  const update = await request.json().catch(() => ({}));
  return Response.json({
    ok: true,
    message: 'Webhook received. Use the chat.id from Telegram updates as telegramChatId.',
    chatId: update?.message?.chat?.id ?? update?.my_chat_member?.chat?.id ?? null
  });
}

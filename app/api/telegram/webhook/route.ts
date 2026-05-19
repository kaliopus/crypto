export const runtime = 'nodejs';

export async function POST(request: Request) {
  const update = await request.json().catch(() => ({}));
  return Response.json({
    ok: true,
    message: 'Webhook received. Use the chat.id from Telegram updates as telegramChatId.',
    chatId: update?.message?.chat?.id ?? update?.my_chat_member?.chat?.id ?? null
  });
}

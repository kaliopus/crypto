import { env } from '@/lib/config';

type TelegramSender = (input: { chatId: string; text: string }) => Promise<{ ok: boolean; error?: string }>;

let senderOverride: TelegramSender | null = null;

export async function sendTelegramMessage(input: { chatId: string; text: string }): Promise<{ ok: boolean; error?: string }> {
  if (senderOverride) return senderOverride(input);
  if (!env.telegramBotToken) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: input.chatId,
        text: input.text,
        disable_web_page_preview: true
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      return { ok: false, error: `Telegram API returned ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown Telegram error' };
  } finally {
    clearTimeout(timeout);
  }
}

export function __setTelegramSenderForTests(sender: TelegramSender | null) {
  senderOverride = sender;
}

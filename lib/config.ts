export const env = {
  get databaseUrl() {
    return process.env.DATABASE_URL;
  },
  get allowMemoryDb() {
    return process.env.ALLOW_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test';
  },
  get cronSecret() {
    return process.env.CRON_SECRET;
  },
  get appBaseUrl() {
    return process.env.APP_BASE_URL ?? 'http://localhost:3000';
  },
  get devUserId() {
    return process.env.RISK_SENTINEL_DEV_USER_ID;
  },
  get telegramBotToken() {
    return process.env.TELEGRAM_BOT_TOKEN;
  },
  get telegramWebhookSecret() {
    return process.env.TELEGRAM_WEBHOOK_SECRET;
  },
  get stripeSecretKey() {
    return process.env.STRIPE_SECRET_KEY;
  },
  get stripeWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET;
  },
  get stripePublishableKey() {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  }
};

export function requireCronSecret() {
  if (!env.cronSecret) {
    throw new Error('CRON_SECRET is required for cron routes.');
  }
  return env.cronSecret;
}

# Production Resources

This file tracks the external resources required before Risk Sentinel can run as a real production service.

## Generated Locally

The local file `.env.production.local` has generated values for:

- `CRON_SECRET`
- `AUTH_SECRET`
- `TELEGRAM_WEBHOOK_SECRET`
- public RPC fallback URLs for Ethereum, Base, Arbitrum, and Optimism

The RPC fallback URLs were smoke-tested with `eth_chainId`.

## Must Be Created In External Accounts

These cannot be safely invented in code:

- Postgres/Neon/Supabase database URL: `DATABASE_URL`
- Upstash Redis REST URL/token: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Telegram bot token from BotFather: `TELEGRAM_BOT_TOKEN`
- Vercel project environment variables
- Stripe keys, if paid checkout is enabled

## Vercel Status

`vercel deploy --prod --yes` was attempted, but the local Vercel token is invalid. Run `vercel login`, then set the production env vars and deploy.

## Validation

After filling the real external values:

```bash
npm run env:check
npm run typecheck
npm run lint
npm test
npm run build
```

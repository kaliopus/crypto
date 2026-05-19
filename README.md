# Risk Sentinel

Risk Sentinel is a DeFi liquidation risk monitoring MVP for Aave V3 positions. It checks a wallet's Health Factor, stores raw risk snapshots, estimates repay or collateral actions needed to restore a target Health Factor, and can send Telegram alerts when risk worsens.

It is risk monitoring and decision support only. It does not custody funds, ask for private keys, auto-trade, deploy contracts, or guarantee liquidation prevention.

## Architecture

```txt
Next.js App Router
  pages: /, /dashboard, /wallets, /pricing
  api:
    /api/health
    /api/check
    /api/watches
    /api/watches/[id]
    /api/cron/check-watches
    /api/telegram/webhook
    /api/billing/checkout

lib/
  protocols/aave -> viem Aave V3 Pool reads
  risk           -> classification + rescue calculator
  db             -> Drizzle schema + Postgres/in-memory repository
  alerts         -> Telegram templates, sender, cooldown decisions
  workers        -> protected scheduled watch checks
```

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

See `.env.example`.

Required for production:

- `DATABASE_URL`
- `CRON_SECRET`
- `APP_BASE_URL`
- one or more RPC URLs: `ETHEREUM_RPC_URL`, `BASE_RPC_URL`, `ARBITRUM_RPC_URL`, `OPTIMISM_RPC_URL`
- `TELEGRAM_BOT_TOKEN` for real alerts

Stripe variables are scaffolded but checkout is a stub until real pricing is configured.

## Database

Generate and run Drizzle migrations:

```bash
npm run db:generate
npm run db:migrate
```

If `DATABASE_URL` is not set, the app uses an in-memory repository for local demos and tests. That mode is not durable.

## Telegram Bot

1. Create a bot with BotFather.
2. Put the token into `TELEGRAM_BOT_TOKEN`.
3. Message the bot from your Telegram account or group.
4. Point Telegram webhook updates to `/api/telegram/webhook` or inspect bot updates manually.
5. Use the returned `chat.id` as `telegramChatId` when creating a watch.

## API Examples

Health:

```bash
curl http://localhost:3000/api/health
```

One-off wallet check:

```bash
curl "http://localhost:3000/api/check?chain=base&wallet=0x0000000000000000000000000000000000000001&protocol=aave-v3&targetHealthFactor=1.4"
```

Create a watch:

```bash
curl -X POST http://localhost:3000/api/watches \
  -H "content-type: application/json" \
  -d "{\"walletAddress\":\"0x0000000000000000000000000000000000000001\",\"chainKey\":\"base\",\"protocolKey\":\"aave-v3\",\"minHealthFactor\":1.25,\"targetHealthFactor\":1.4}"
```

Trigger cron:

```bash
curl http://localhost:3000/api/cron/check-watches \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Testing

```bash
npm test
npm run build
```

Tests mock away live RPC by using the adapter error path and in-memory repository. CI should not depend on live chain calls.

## Deployment Notes

- Use Vercel for the web app and Vercel Cron for `/api/cron/check-watches`.
- Configure `CRON_SECRET` and send it as `Authorization: Bearer <secret>`.
- Use production-grade RPC providers with rate limits and monitoring.
- Use Postgres in production; in-memory storage is only for local demos.
- Verify explicit Aave Pool addresses against official Aave docs or the Aave address-book package before production.

## Limitations

- Aave V3 only in V0.
- Rescue amounts are base-currency approximations, not asset-specific transaction quotes.
- Collateral addition assumes the same effective liquidation threshold as the current collateral mix.
- Telegram can be disabled by leaving `TELEGRAM_BOT_TOKEN` empty; events are still stored as failed or suppressed.
- Billing checkout is stubbed.

## Roadmap

- Morpho adapter.
- One-click unsigned rescue transaction preparation.
- Transaction simulation before signing.
- Webhooks and B2B API keys.
- PostHog/Sentry integration.

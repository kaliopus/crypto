# Risk Sentinel — Product & Architecture

## Product thesis

Risk Sentinel monitors DeFi borrow/leverage positions and warns users before
liquidation risk becomes critical. It answers one narrow question:

> "Tell me when my Aave position is becoming dangerous, explain why, and show
> the minimum repay/add-collateral action needed to restore safety."

V0 supports **Aave V3 only**, with an architecture meant to extend to Morpho,
Spark, Euler, Fluid, and future execution modules without a rewrite.

It is risk monitoring and decision support only:

- No custody of funds.
- No private keys or seed phrases requested, ever.
- No auto-repay or auto-trading.
- No liquidation racing, flashloan arbitrage, sandwiching, or exploit code.
- No smart contract deployment.
- No claims of "guaranteed" liquidation prevention — copy must say "risk
  monitoring and decision support," not a guarantee.

## Non-negotiable constraints

- TypeScript everywhere.
- `viem` for EVM/RPC (preferred over `ethers`).
- All API input validated with Zod.
- All chain calls have timeout/retry handling.
- All cron/worker routes protected by `CRON_SECRET` (or equivalent auth).
- Raw risk snapshots are always stored, for future analytics.
- No hardcoded RPC URLs, bot tokens, database URLs, or secrets.
- Favor explicit, boring, reliable code over clever abstractions.

## Tech stack

**Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, wagmi +
viem for wallet connect, TanStack Query.

**Backend:** Next.js Route Handlers, Node.js runtime for DB/RPC/Telegram
routes, viem public clients for RPC reads, Zod validation, Drizzle ORM +
PostgreSQL, Upstash Redis / Postgres advisory locks for worker locking,
Telegram Bot API via fetch, Stripe (scaffolded).

**Database:** PostgreSQL via Drizzle migrations (Neon/Supabase/Railway/Vercel
Postgres compatible).

**Ops:** Vercel for the web app, Vercel Cron for scheduled checks, structured
logs (Sentry/PostHog optional).

## Chain support (V0)

Aave V3 on Ethereum mainnet, Base, Arbitrum, and Optimism, via a typed chain
registry (`lib/chains.ts`: `ChainKey`, `ChainConfig`, `getChainConfig`,
`getRpcUrl`).

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

## Domain concepts

- **User** — may own multiple Watches.
- **Watch** — monitors one wallet on one chain/protocol with a minimum safe
  Health Factor threshold.
- **RiskSnapshot** — stores the result of every check.
- **AlertEvent** — stores every alert sent, suppressed, or failed.
- **ProtocolAdapter** — abstracts Aave now, Morpho/others later, behind a
  common `getPositionRisk(...)` interface.

## Roadmap (not yet built)

- Morpho adapter.
- One-click unsigned rescue transaction preparation, with simulation before
  signing.
- Risk-aware execution: compare CoW/0x/UniswapX/direct routes, estimate
  slippage/MEV before executing a rescue.
- Webhooks and B2B API keys.
- PostHog/Sentry integration.

## Setup (local)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required production env vars: `DATABASE_URL`, `CRON_SECRET`, `AUTH_SECRET`,
`APP_BASE_URL`, at least one chain RPC URL, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL` /
`UPSTASH_REDIS_REST_TOKEN`. See `.env.example` for the full list. Without
`DATABASE_URL`, the app falls back to an in-memory repository — fine for local
demos/tests, disabled in production.

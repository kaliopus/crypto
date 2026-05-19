# Codex Prompt — Risk Sentinel: DeFi Liquidation Risk & Rescue MVP

You are a senior full-stack engineer, DeFi protocol engineer, and security-minded architect. Build a production-grade MVP called **Risk Sentinel**.

## 0. Product thesis

Risk Sentinel monitors DeFi borrow/leverage positions and warns users before liquidation risk becomes critical. The MVP must start with Aave V3 only and must be extensible to Morpho, Spark, Euler, Fluid, and future execution modules.

Do **not** build custody, auto-repay, private-key handling, liquidation racing, flashloan arbitrage, sandwiching, exploit code, or unattended trading automation in V0.

The MVP must solve this narrow pain:

> “Tell me when my Aave position is becoming dangerous, explain why, and show the minimum repay/add-collateral action needed to restore safety.”

## 1. Build target

Create a Next.js + TypeScript web app with:

1. Wallet risk check for Aave V3 positions.
2. User-created watch rules for wallets and chains.
3. Scheduled monitoring worker.
4. Telegram alerts.
5. Basic dashboard.
6. Risk snapshots stored in Postgres.
7. Rescue calculator estimating:
   - current Health Factor,
   - distance to liquidation,
   - target Health Factor,
   - estimated debt repayment needed,
   - estimated collateral addition needed.
8. Stripe-ready billing architecture, but payment can be stubbed if time is limited.
9. Clean modular architecture so Morpho support can be added later without rewriting the system.

## 2. Non-negotiable constraints

- Use TypeScript everywhere.
- Use EVM libraries with strong typing. Prefer `viem` over `ethers` unless there is a compelling reason.
- No private keys.
- No custodial accounts.
- No automatic transactions in V0.
- No smart contract deployment in V0.
- No claims that the system “guarantees liquidation prevention.” Use “risk monitoring and decision support.”
- All API inputs must be validated with Zod.
- All chain calls must have timeout/retry handling.
- All cron/worker routes must be protected with `CRON_SECRET` or equivalent auth.
- Store raw risk snapshots to enable future analytics.
- Do not hardcode RPC URLs, bot tokens, database URLs, or secrets.
- Favor explicit, boring, reliable code over clever abstractions.

## 3. Recommended stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or minimal custom components
- wagmi + viem for wallet connect and client-side wallet address handling
- TanStack Query for client data fetching

### Backend

- Next.js Route Handlers for API endpoints
- Node.js runtime for routes that touch database/RPC/Telegram
- viem public clients for RPC reads
- Zod for validation
- Drizzle ORM + PostgreSQL
- Upstash Redis or Postgres advisory locks for worker locking
- Telegram Bot API via fetch
- Stripe later; scaffold billing models now

### Database

- PostgreSQL
- Drizzle migrations
- Neon/Supabase/Railway/Vercel Postgres compatible

### Monitoring / ops

- Vercel for web app
- Vercel Cron for early MVP or external cron/worker for production
- Sentry or simple structured logs initially
- PostHog optional for product analytics

### Chain support for V0

Support Aave V3 on:

- Ethereum mainnet
- Base
- Arbitrum
- Optimism

Represent supported chains via a typed registry.

## 4. Suggested repository structure

```txt
risk-sentinel/
  app/
    layout.tsx
    page.tsx
    dashboard/
      page.tsx
    wallets/
      page.tsx
    pricing/
      page.tsx
    api/
      health/route.ts
      check/route.ts
      watches/route.ts
      watches/[id]/route.ts
      cron/check-watches/route.ts
      telegram/webhook/route.ts
      billing/checkout/route.ts
  components/
    RiskCard.tsx
    WatchForm.tsx
    PositionTable.tsx
    RescuePlanCard.tsx
    AlertHistory.tsx
    ChainBadge.tsx
  lib/
    config.ts
    logger.ts
    auth.ts
    chains.ts
    db/
      index.ts
      schema.ts
      migrations/
    protocols/
      types.ts
      aave/
        client.ts
        constants.ts
        math.ts
        risk.ts
      morpho/
        README.md
    risk/
      engine.ts
      rescue.ts
      thresholds.ts
      format.ts
    alerts/
      telegram.ts
      templates.ts
    workers/
      checkWatches.ts
      locks.ts
    validation/
      schemas.ts
    billing/
      stripe.ts
  tests/
    unit/
      aaveMath.test.ts
      riskEngine.test.ts
      rescueCalculator.test.ts
    integration/
      checkRoute.test.ts
  drizzle.config.ts
  package.json
  .env.example
  README.md
```

## 5. Domain model

### Key concepts

A **User** may add multiple **Watches**. A watch monitors one wallet on one chain/protocol with a minimum safe Health Factor threshold.

A **RiskSnapshot** stores each check result. An **AlertEvent** stores every alert sent, suppressed, or failed.

A **ProtocolAdapter** abstracts Aave now and Morpho later.

## 6. Database schema

Implement with Drizzle.

### users

```ts
users: {
  id: uuid primary key default gen_random_uuid(),
  email: text nullable unique,
  telegramChatId: text nullable,
  createdAt: timestamp default now(),
  updatedAt: timestamp default now()
}
```

For V0, auth can be simple magic-link placeholder or dev-mode user. Do not overbuild authentication unless requested. But keep schema ready for real auth.

### watches

```ts
watches: {
  id: uuid primary key default gen_random_uuid(),
  userId: uuid references users(id) nullable,
  walletAddress: text not null,
  chainKey: text not null,          // ethereum | base | arbitrum | optimism
  protocolKey: text not null,       // aave-v3 for V0
  minHealthFactor: numeric not null default 1.25,
  targetHealthFactor: numeric not null default 1.40,
  telegramChatId: text nullable,
  alertCooldownMinutes: integer not null default 30,
  isActive: boolean not null default true,
  lastCheckedAt: timestamp nullable,
  lastAlertedAt: timestamp nullable,
  createdAt: timestamp default now(),
  updatedAt: timestamp default now()
}
```

Indexes:

- `(isActive, lastCheckedAt)`
- `(walletAddress, chainKey, protocolKey)`

### risk_snapshots

```ts
riskSnapshots: {
  id: uuid primary key default gen_random_uuid(),
  watchId: uuid references watches(id),
  walletAddress: text not null,
  chainKey: text not null,
  protocolKey: text not null,
  blockNumber: bigint nullable,
  healthFactor: numeric nullable,
  healthFactorRaw: text nullable,
  totalCollateralBase: text nullable,
  totalDebtBase: text nullable,
  currentLiquidationThreshold: text nullable,
  ltv: text nullable,
  availableBorrowsBase: text nullable,
  riskLevel: text not null,         // none | safe | watch | warning | critical | liquidatable | unknown
  dangerReason: text nullable,
  repayToTargetBase: text nullable,
  collateralToTargetBase: text nullable,
  rawJson: jsonb not null,
  createdAt: timestamp default now()
}
```

Indexes:

- `(watchId, createdAt desc)`
- `(chainKey, protocolKey, createdAt desc)`
- `(riskLevel, createdAt desc)`

### alert_events

```ts
alertEvents: {
  id: uuid primary key default gen_random_uuid(),
  watchId: uuid references watches(id),
  snapshotId: uuid references riskSnapshots(id) nullable,
  channel: text not null,           // telegram | email | discord | webhook
  status: text not null,            // sent | suppressed | failed
  reason: text nullable,
  payloadJson: jsonb not null,
  createdAt: timestamp default now()
}
```

### billing_subscriptions

```ts
billingSubscriptions: {
  id: uuid primary key default gen_random_uuid(),
  userId: uuid references users(id),
  provider: text not null default 'stripe',
  providerCustomerId: text nullable,
  providerSubscriptionId: text nullable,
  status: text not null default 'free',
  planKey: text not null default 'free',
  currentPeriodEnd: timestamp nullable,
  createdAt: timestamp default now(),
  updatedAt: timestamp default now()
}
```

## 7. Environment variables

Create `.env.example`:

```bash
DATABASE_URL="postgresql://..."
CRON_SECRET="change-me"
APP_BASE_URL="http://localhost:3000"

TELEGRAM_BOT_TOKEN=""

ETHEREUM_RPC_URL=""
BASE_RPC_URL=""
ARBITRUM_RPC_URL=""
OPTIMISM_RPC_URL=""

STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
```

## 8. Chain registry

Create `lib/chains.ts`:

```ts
export type ChainKey = 'ethereum' | 'base' | 'arbitrum' | 'optimism';

export type ChainConfig = {
  key: ChainKey;
  chainId: number;
  name: string;
  rpcEnvVar: string;
  nativeSymbol: string;
  explorerBaseUrl: string;
};
```

Include a typed `CHAINS` map and helper `getChainConfig(chainKey)`.

## 9. Protocol adapter interface

Create `lib/protocols/types.ts`:

```ts
export type ProtocolKey = 'aave-v3' | 'morpho-blue';

export type PositionRisk = {
  protocolKey: ProtocolKey;
  chainKey: string;
  walletAddress: `0x${string}`;
  blockNumber?: bigint;
  healthFactor: number | null;
  healthFactorRaw?: string;
  totalCollateralBase?: bigint;
  totalDebtBase?: bigint;
  availableBorrowsBase?: bigint;
  currentLiquidationThreshold?: bigint;
  ltv?: bigint;
  riskLevel: 'none' | 'safe' | 'watch' | 'warning' | 'critical' | 'liquidatable' | 'unknown';
  dangerReason: string;
  rescuePlan?: RescuePlan;
  raw: unknown;
};

export type RescuePlan = {
  targetHealthFactor: number;
  repayToTargetBase: bigint | null;
  collateralToTargetBase: bigint | null;
  explanation: string;
  assumptions: string[];
};

export interface ProtocolAdapter {
  protocolKey: ProtocolKey;
  getPositionRisk(input: {
    walletAddress: `0x${string}`;
    chainKey: string;
    targetHealthFactor: number;
  }): Promise<PositionRisk>;
}
```

## 10. Aave V3 adapter

Build `lib/protocols/aave/client.ts`.

Use viem to call Aave V3 Pool `getUserAccountData(address)`.

Function signature to implement:

```ts
export async function getAaveUserAccountData(input: {
  chainKey: ChainKey;
  walletAddress: `0x${string}`;
}): Promise<{
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
  blockNumber: bigint;
}>;
```

Do not manually paste random pool addresses from the internet. Prefer official Aave address-book package if available. If the package is not available or breaks, add an explicit `constants.ts` with validated addresses and comments saying they must be verified against official Aave docs before production.

Aave `healthFactor` is returned as a fixed-point WAD-style value. Convert it carefully for display. Preserve raw bigint string in DB.

Handle these cases:

1. No debt: health factor can be max uint / extremely large. Risk level should be `none` or `safe`, and rescue plan should be null.
2. No collateral and no debt: risk level `none`.
3. Debt exists and health factor < 1: `liquidatable`.
4. RPC error: risk level `unknown`, store error metadata.

## 11. Risk scoring

Create `lib/risk/thresholds.ts`:

```ts
export const DEFAULT_THRESHOLDS = {
  watch: 1.5,
  warning: 1.25,
  critical: 1.1,
  liquidatable: 1.0,
};
```

Risk classification:

```txt
no debt                         => none
HF >= watch                     => safe
warning <= HF < watch           => watch
critical <= HF < warning        => warning
liquidatable <= HF < critical   => critical
HF < liquidatable               => liquidatable
unknown/error                   => unknown
```

Allow user-specific `minHealthFactor` to trigger alerts even if global level says safe/watch.

## 12. Rescue calculator

Create `lib/risk/rescue.ts`.

Goal: estimate minimum repayment or collateral addition required to reach target HF.

For Aave approximation:

```txt
HF = collateralAdjusted / debt
collateralAdjusted = totalCollateralBase * currentLiquidationThreshold / 10000
```

Given target HF `T`:

### Repay estimate

```txt
requiredDebtAfter = collateralAdjusted / T
repayNeeded = max(0, totalDebtBase - requiredDebtAfter)
```

### Add collateral estimate

Approximation assumes new collateral has the same effective liquidation threshold as current weighted position:

```txt
requiredCollateralAdjusted = totalDebtBase * T
additionalAdjustedCollateral = max(0, requiredCollateralAdjusted - collateralAdjusted)
additionalCollateralBase = additionalAdjustedCollateral / weightedLiquidationThreshold
```

Important: mark collateral addition as an approximation, because real result depends on which asset is supplied and its liquidation threshold.

Return base-currency units first. Later add asset-specific conversion.

## 13. Alert engine

Create `lib/alerts/telegram.ts`.

Implement:

```ts
export async function sendTelegramMessage(input: {
  chatId: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }>;
```

Telegram message template:

```txt
⚠️ Risk Sentinel Alert

Wallet: 0x1234...abcd
Chain: Base
Protocol: Aave V3
Risk: CRITICAL
Health Factor: 1.08
Your threshold: 1.25
Target HF: 1.40

Estimated rescue:
- Repay: ~842.13 base units of debt value
- Or add collateral: ~1,020.55 base units of collateral value

Reason: Health Factor is below your configured threshold.

Open dashboard: https://...
```

Do not include secrets, full raw JSON, or sensitive debug info in alerts.

Implement cooldown logic:

- Do not spam alerts.
- Send alert if risk level worsens.
- Send alert if HF is below user's threshold and cooldown passed.
- Store suppressed alerts with status `suppressed` and reason.

## 14. API endpoints

### `GET /api/health`

Return:

```json
{ "ok": true, "service": "risk-sentinel", "time": "..." }
```

### `GET /api/check?chain=base&wallet=0x...&protocol=aave-v3&targetHealthFactor=1.4`

Validate query with Zod.

Return current risk without creating a watch.

Response example:

```json
{
  "ok": true,
  "data": {
    "protocolKey": "aave-v3",
    "chainKey": "base",
    "walletAddress": "0x...",
    "healthFactor": 1.17,
    "riskLevel": "warning",
    "dangerReason": "Health Factor is below warning threshold.",
    "rescuePlan": {
      "targetHealthFactor": 1.4,
      "repayToTargetBase": "84213000000",
      "collateralToTargetBase": "102055000000",
      "explanation": "...",
      "assumptions": ["..."]
    }
  }
}
```

### `POST /api/watches`

Body:

```json
{
  "walletAddress": "0x...",
  "chainKey": "base",
  "protocolKey": "aave-v3",
  "minHealthFactor": 1.25,
  "targetHealthFactor": 1.4,
  "telegramChatId": "123456789"
}
```

Create a watch and immediately run one check.

### `GET /api/watches`

Return active watches.

For V0, if auth is not implemented, return all watches in dev mode only. In production, require a user session.

### `PATCH /api/watches/[id]`

Update threshold, target HF, Telegram chat ID, or active status.

### `DELETE /api/watches/[id]`

Soft-disable watch by setting `isActive=false`.

### `GET /api/cron/check-watches`

Protected by `Authorization: Bearer ${CRON_SECRET}`.

Worker behavior:

1. Acquire lock.
2. Load active watches due for checking.
3. Check each watch with concurrency limit, e.g. 5.
4. Store risk snapshot.
5. Decide if alert should be sent.
6. Send Telegram alert.
7. Store alert event.
8. Update watch `lastCheckedAt` and maybe `lastAlertedAt`.
9. Return summary.

Response:

```json
{
  "ok": true,
  "checked": 42,
  "alertsSent": 3,
  "alertsSuppressed": 8,
  "failed": 1
}
```

## 15. Frontend pages

### Landing page `/`

Must communicate:

- “Telegram alerts before your Aave position gets liquidated.”
- “No custody. No private keys. No auto-trading.”
- “Shows what to repay or add to restore target Health Factor.”

CTA:

- Check wallet
- Create watch

### Dashboard `/dashboard`

Show:

- watches table
- wallet
- chain
- protocol
- current HF
- risk level
- threshold
- target HF
- last checked
- alert status

### Watch creation form

Fields:

- wallet address
- chain
- protocol
- min Health Factor
- target Health Factor
- Telegram chat ID

Validate client-side and server-side.

### Risk card

Show:

- Health Factor
- risk level
- total collateral base
- total debt base
- liquidation threshold
- rescue plan
- assumptions

## 16. Testing

Use Vitest or Jest.

Unit tests required:

1. Health Factor raw conversion.
2. Risk-level classification.
3. No-debt position handling.
4. Liquidatable position handling.
5. Repay-to-target formula.
6. Collateral-to-target approximation.
7. Alert cooldown logic.
8. Zod validation rejects bad wallet address/chain.

Integration tests:

1. `/api/check` returns valid shape for mocked Aave adapter.
2. `/api/watches` creates watch.
3. Cron rejects missing/invalid `CRON_SECRET`.
4. Cron processes due watches using mocked adapter and mocked Telegram sender.

Mock chain/RPC calls in tests. Do not rely on live RPC in CI tests.

## 17. Reliability requirements

- Use structured logs.
- Do not let one bad watch fail the whole cron run.
- Use concurrency limits.
- Use retries with backoff for RPC and Telegram failures.
- Store failed checks as `unknown` snapshots when possible.
- Make cron idempotent enough that double execution does not spam alerts.
- Add a worker lock to avoid parallel cron runs.
- Add request rate limits for public endpoints if possible.

## 18. Security requirements

- Never log secrets.
- Never store private keys.
- Never ask for seed phrases.
- Validate all wallet addresses.
- Sanitize user-controlled text in alerts and UI.
- Protect cron endpoint.
- Use separate env vars for production and preview.
- Add clear disclaimer: this is not financial advice and cannot guarantee liquidation prevention.

## 19. Product analytics events

Add simple server-side event logging or table later. For now, leave hooks/comments for:

- wallet_checked
- watch_created
- alert_sent
- alert_suppressed
- threshold_updated
- rescue_plan_viewed
- billing_started

## 20. Milestones

### Milestone 1 — Core check

- Project setup
- Chain registry
- Aave adapter
- `/api/check`
- Risk classification
- Rescue calculator
- Unit tests

### Milestone 2 — Watches and cron

- DB schema
- Create/list/update/delete watches
- Cron worker
- Snapshots
- Alert events
- Telegram alerts
- Cooldown logic

### Milestone 3 — UI

- Landing page
- Dashboard
- Watch form
- Risk card
- Alert history

### Milestone 4 — Billing scaffold

- Plans config
- Subscription table
- Stripe checkout stub or real checkout
- Watch limits by plan

### Milestone 5 — Production hardening

- Sentry/logging
- Worker locks
- Rate limiting
- Retry/backoff
- README deployment instructions
- Seed/demo data

## 21. Acceptance criteria

The project is acceptable only if:

1. `npm install` works.
2. `npm run dev` starts the app.
3. `.env.example` is complete.
4. `npm test` passes.
5. `/api/health` returns ok.
6. `/api/check` can check a mocked or real Aave V3 wallet.
7. User can create a watch.
8. Cron route is protected.
9. Cron stores snapshots.
10. Telegram sending is implemented and can be disabled/mocked in dev.
11. Dashboard displays watch status.
12. No private key or custody flow exists.
13. README explains setup, DB migration, env vars, cron, and Telegram bot setup.

## 22. README requirements

Write a README with:

- Product summary
- Architecture diagram in text
- Setup instructions
- Environment variables
- Database migration command
- How to create Telegram bot and find chat ID
- How to run local dev
- How to call `/api/check`
- How to create a watch
- How to manually trigger cron
- Deployment notes
- Limitations and disclaimers
- Roadmap

## 23. Future roadmap — do not implement unless time remains

### Phase 2: Morpho support

- Add Morpho adapter.
- Normalize Morpho market/vault risk into `PositionRisk`.
- Track collateral, borrow shares, oracle price, LLTV, vault curator risk.

### Phase 3: One-click rescue transactions

- Prepare unsigned repay/add collateral transactions.
- User signs with wallet.
- Add tx simulation before signing.
- Use safe execution routes.

### Phase 4: Risk-aware execution

- Compare CoW/0x/UniswapX/direct routes.
- Estimate slippage and MEV risk.
- Prepare safest rescue route.

### Phase 5: B2B API

- API keys.
- Webhooks.
- Wallet/protocol integrations.
- Team dashboard.

## 24. Important implementation notes

- The first version must be small but real.
- Prioritize correctness over visual polish.
- Make the architecture extensible but do not over-abstract.
- Every complex formula must have a short comment explaining assumptions.
- Every external call must have timeout and error handling.
- Use mocked adapters for tests.
- Leave clear TODOs only for features outside MVP, not for broken core functionality.

Now implement the full MVP according to this specification.

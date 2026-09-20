# Risk Sentinel — Implementation Status

Condensed from the project's internal handoff report (dated 2026-05-19).
Later commits (see repo git log — Supabase hardening, per-user watch
scoping, Postgres advisory cron lock, Aave address-book constants, API rate
limiting, Telegram webhook secret verification) have since closed several of
the gaps noted below; treat this file as "what V0 looked like," and
`04-audit-findings-and-remediation.md` / `docs/PRODUCTION_RESOURCES.md` in
the repo as the more current picture.

## What was built

Full Next.js/TypeScript app matching the spec in
`risk_sentinel_codex_prompt.md`:

- **Frontend pages:** `/` (landing + quick watch form), `/dashboard` (watch
  table, creation form, alert history), `/wallets` (one-off risk check,
  wallet connect panel), `/pricing` (billing scaffold).
- **Wallet connect:** wagmi injected connector, address-handling only — no
  transaction signing, no private-key requests, no auto-trading.
- **API route handlers:** all 9 endpoints listed in
  `02-domain-model-and-api.md`.
- **Validation:** all input goes through `lib/validation/schemas.ts`
  (wallet address format, supported chain, protocol key, HF bounds, update
  payloads).
- **Aave V3 adapter:** `lib/protocols/aave/{client,constants,risk}.ts`,
  calling `Pool.getUserAccountData`. Pool addresses were originally
  hand-added with a comment to verify against the official address-book —
  later addressed via `@aave-dao/aave-address-book` (see audit doc).
- **Protocol adapter interface:** `lib/protocols/types.ts`, with a Morpho
  placeholder (`lib/protocols/morpho/README.md`) and test-only adapter
  injection (`__setProtocolAdapterForTests`) so integration tests don't need
  live RPC.
- **Risk scoring & rescue calculator:** `lib/risk/{thresholds,rescue}.ts`.
- **Database:** Drizzle schema (`lib/db/schema.ts`), generated migration
  (`lib/db/migrations/0000_wakeful_sentry.sql`), repository
  (`lib/db/repository.ts`) with a Postgres-or-in-memory fallback (memory
  mode only for local dev/tests; not durable in production).
- **Telegram alerts:** `lib/alerts/{telegram,templates,engine}.ts`, with
  cooldown logic and a test-only sender override
  (`__setTelegramSenderForTests`).
- **Worker/cron:** `lib/workers/checkWatches.ts` + `lib/workers/locks.ts`,
  protected by `CRON_SECRET`, concurrency-limited with `p-limit` (5), one bad
  watch cannot fail the whole run. Lock started as in-memory (single-process
  only) — later addressed with a Postgres advisory lock for Postgres
  deployments.
- **Billing:** scaffold only (`lib/billing/stripe.ts`,
  `app/api/billing/checkout/route.ts`, `billing_subscriptions` table);
  checkout is a stub.

## Tests

Vitest. Unit tests: `riskEngine`, `rescueCalculator`, `alertEngine`,
`validation`. Integration tests: `tests/integration/routes.test.ts` (health
check, mocked Aave check, watch creation + snapshot, cron auth rejection,
cron processing with mocked adapter/Telegram, snapshot + `sent` alert event
storage). At last report: 5 test files, 15 tests, all passing. `npm run
build` also passing.

A real bug integration tests caught: `POST /api/watches` originally tried to
return a snapshot containing a `bigint`, and `Response.json` doesn't know how
to serialize `BigInt` — fixed via `serializeSnapshot`.

## Known environment warnings (non-blocking)

- Next SWC native binary warning on Windows dev machines (build still
  succeeds).
- Next was outdated locally (15.5.18 vs latest at the time, 16.2.6) —
  upgrade treated as a separate migration task, not done here.
- A `viem/chains` / `ox tempo` dependency-trace warning during build (build
  still succeeds).
- **"Ruflo MCP"**: `AGENTS.md` in this repo instructs use of a "Ruflo MCP"
  tool set (`hooks_route`, `guidance_recommend`, `browser_session_record`,
  `memory_store`, `swarm_init`, `agent_spawn`, etc.) for complex/multi-file
  tasks. Every prior session that tried it got `Transport closed` — the
  tools are not actually reachable. Multiple audit/handoff docs in this repo
  independently record this as a dead end. Don't spend time chasing it.

## What was intentionally left incomplete (as of the handoff report)

- **Auth:** dev-mode only at that point (temporary header/cookie/env user
  boundary), not a real session/auth provider. *(Since hardened — see audit
  doc: forged dev header/cookie/env auth is now rejected in production,
  signed auth cookie required; full auth provider/SIWE still pending.)*
- **Stripe:** checkout stub, no real customer/session/webhook/subscription
  sync yet.
- **Aave address verification:** addresses not checked live against an
  official address-book at handoff time. *(Since addressed via
  `@aave-dao/aave-address-book` with a regression test pinning supported
  chain pool constants.)*
- **Rate limiting:** none on public endpoints at handoff time. *(Since
  addressed for `/api/check` and `POST /api/watches` via Upstash Redis
  sliding-window limiter; production fails closed with 503 if the limiter
  env is missing.)*
- **Worker lock:** in-memory only at handoff time. *(Since addressed with
  Postgres advisory lock for Postgres deployments.)*
- **Browser automation:** no Playwright/Cypress coverage — verification was
  HTTP smoke tests, `npm run build`, and unit/integration tests only. Still
  an open gap.

## Acceptance criteria (from the original spec) — status at handoff

All 13 base acceptance criteria were met (install/dev/env-example/tests
pass, health/check endpoints work, watch creation works, cron
protected+tested, Telegram sendable/mockable, dashboard shows watch status,
no private-key/custody flow, README covers setup). Partially production-ready
at the time: live Aave checks need real RPC env vars configured; production
auth/rate-limit/Stripe checkout and official Aave address verification were
still pending (several of these have since been closed — see above).

## Files most important for review

`app/api/check/route.ts`, `app/api/watches/route.ts`,
`app/api/cron/check-watches/route.ts`, `lib/risk/engine.ts`,
`lib/risk/rescue.ts`, `lib/risk/thresholds.ts`,
`lib/protocols/aave/{client,risk,constants}.ts`,
`lib/workers/checkWatches.ts`, `lib/alerts/engine.ts`,
`lib/db/{repository,schema}.ts`, `tests/integration/routes.test.ts`.

# Risk Sentinel — Curator Audit Findings & Remediation

Condensed from `CURATOR_AUDIT_REPORT.md` (dated 2026-05-19, produced by a
6-agent review panel — see `05-curator-review-process.md`). Verdict at the
time: a real engineering base, but **not production-ready**. Status notes in
bold below are the audit's own "addressed" annotations, not a re-verification
by this digest — check current code if precision matters.

## Critical blockers

1. **Public watch CRUD without auth/ownership.** `GET /api/watches` returned
   all watches; PATCH/DELETE only checked id existence, not owner. Leaked
   wallet/Telegram chat id privacy and allowed tampering.
   **Addressed:** temporary user boundary via signed cookie / dev header,
   all watch endpoints scoped by user id, cross-user access denial covered
   by tests. Still needed: a real auth provider/session system before paid
   beta.
2. **Silent in-memory fallback could lose production data** — `getDb()`
   returning `null` silently wrote to process memory. Fix: fail fast in
   production when `DATABASE_URL` is missing; memory mode only via explicit
   test/demo flag.
3. **Cron lock was process-local** (module-level boolean) — broken under
   multi-instance/serverless cron, causing duplicate snapshots/alerts.
   **Addressed:** Postgres advisory lock (`pg_try_advisory_xact_lock`) for
   Postgres deployments; in-memory fallback remains for test/demo only.
4. **Alert send not idempotent** — a crash between Telegram send and
   persistence could cause resend. Needs an alert outbox/idempotency key,
   pending-before-send persistence, sent/failed status with retry metadata.
5. **Collateral rescue estimate used floor division** — could understate the
   collateral needed by ≥1 base unit. **Addressed:** switched to ceiling
   division, with conservative-rounding tests.
6. **Base-unit semantics not user-safe** — raw Aave base-currency integers
   shown without currency/decimal labeling, risking user misunderstanding of
   rescue amounts. Needs explicit labeling + "estimate, not a transaction
   quote" language + reference-currency metadata.
7. **User alert threshold could be ignored when the global risk band was
   "safe."** E.g. `minHealthFactor=1.8` with HF=1.6 wouldn't alert because
   global classification says `safe`. **Addressed:** user threshold now
   evaluated before global suppression, with a regression test.
8. **Aave adapter is HF-correct but not enough for token-level rescue** — no
   debt/collateral asset, oracle price, decimals, liquidation bonus, or
   reserve state, so real per-asset rescue guidance isn't possible yet. Fix:
   mark current plan as a planning estimate only; add asset-level Aave data
   before token-specific guidance.
9. **Missing Aave V3 semantic modes** — no user eMode, isolation mode,
   siloed borrowing, paused/frozen reserves, oracle sentinel state,
   liquidation bonus/close-factor regimes. System can report aggregate HF
   but can't explain *why* a position is dangerous or which actions are
   blocked.

## High findings

- **No rate limiting** on `/api/check`, `/api/watches`,
  `/api/telegram/webhook`, cron. **Addressed** for `/api/check` and
  `POST /api/watches` via Upstash Redis sliding-window limiter (production
  fails closed with 503 if the limiter env is missing).
- **No reliable lint gate** — `next lint` was deprecated/interactive.
  **Addressed** with a non-interactive ESLint config.
- **No browser/E2E validation** — tests are Node-only, no Playwright/Cypress
  smoke. Still open.
- **Wallet Connect not wired into the user flow** — address is shown but not
  usable to prefill the check/watch form; no connect-error/chain-mismatch
  handling. Still open.
- **Aave adapter correctness unproven against live/fork tests** — only
  mocked. Still open (needs env-gated live RPC smoke tests).
- **Protocol adapter interface is too Aave-shaped** — `PositionRisk` assumes
  HF/LTV/liquidation-threshold/base-debt-collateral, which may not fit
  Morpho Blue/Euler/Fluid safely. Needs a redesign around generic
  `AccountRisk`/`MarketRiskContribution`/`ProtocolSemantics` before adding
  new protocols.
- **Oracle/stale-data risk not modeled** — no block timestamp/data-age/RPC
  provider identity/stale cutoff tracking; `readContract` and
  `getBlockNumber` aren't pinned to the same block. Still open.

## Medium findings

- Dashboard shows config fields only — missing latest HF, risk level, alert
  status, last error, next check, edit/pause/delete actions, empty state.
- Alert history UI is a placeholder, not wired to real alert events.
- Form error handling shows raw `JSON.stringify(error)`; needs
  `try/finally`, human-readable mapping, `aria-live`.
- Telegram webhook was unauthenticated. **Addressed:** `TELEGRAM_WEBHOOK_SECRET`
  + Telegram secret-token header verification.
- Logger redaction was value-based only (key-blind) — needs key-based
  redaction too (`cronSecret`, `telegramBotToken`, `databaseUrl`, etc.).
- Alert payload stores full Telegram text — should store a template
  id/hash/minimal metadata unless retention needs the full text.
- Latest-snapshot query used `limit(1)` without deterministic ordering in
  Postgres. **Addressed:** deterministic `createdAt desc` ordering restored,
  with a test.

## Already addressed during agent setup

`.swarm/` and `tsconfig.tsbuildinfo` were untracked and risky to publish —
added to `.gitignore` (commit `5052149`).

## Remediation phases (order, with status where marked "Addressed")

**Phase 0 — Immediate safety fixes:** ceiling division for collateral
estimate ✅; user `minHealthFactor` overriding global safe band ✅; fail
closed in production without `DATABASE_URL` ✅; auth/ownership boundary for
watch CRUD ✅ (temporary, full provider/SIWE still pending); `.gitignore`
fix ✅; deterministic snapshot ordering ✅; non-interactive lint gate ✅.

**Phase 1 — Reliability hardening:** distributed cron lock ✅ (Postgres);
alert idempotency/outbox (open); due-predicate watch selection ✅
(`checkIntervalMinutes`/`nextCheckAt`); Telegram retry/backoff + failure
status (open); worker run audit table (open).

**Phase 2 — Security and abuse controls:** rate limiting ✅ (`/api/check`,
`POST /api/watches`); Telegram webhook verification ✅; Telegram chat id
validation/binding (open); logger redaction improvement (open); CI with
test/build/lint/audit gates ✅ (GitHub CI: npm ci, lint, typecheck, tests,
build, high/critical audit gate).

**Phase 3 — Product and QA:** browser/e2e smoke tests (open); wallet connect
flow improvement (open); dashboard HF/risk/alert status (open); real alert
history (open); form error UX/accessibility (open).

**Phase 4 — DeFi correctness:** Aave pool constants verified against
address-book ✅ (`@aave-dao/aave-address-book`, regression test pins
constants); optional live RPC/fork smoke checks (open); base-currency
decimals/reference metadata (open); more edge-case math tests (open);
document unsupported Aave nuances (open); extend adapter for
eMode/isolation semantics (open); redesign protocol adapter interface before
Morpho/Euler/Fluid (open).

## Production readiness decision (at time of audit)

**Not production-ready.** Allowed: local development, technical demo,
internal review, architecture iteration. Not allowed yet: public beta, real
user monitoring promises, paid launch, unattended production cron, claims of
financial decision accuracy.

## Curator ownership

Meitner (DeFi Protocol) — protocol correctness & risk math. Rawls (Backend) —
DB, worker reliability, migrations. Ohm (Security) — secrets, abuse control,
CI/CD, ops risk. Kepler (Product/QA) — UX, frontend quality, browser
testing, accessibility, release checklist. Sagan (Aave V3 specialist) —
lending semantics, address-book verification, reserve/user configuration
coverage, adapter correctness. Kuhn (Liquidation/Oracle/Rescue specialist) —
stale-data policy, market-risk assumptions, execution safety boundaries.
Every future major change should be reviewed by the relevant curator before
being considered ready.

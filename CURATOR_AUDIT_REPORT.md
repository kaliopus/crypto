# Risk Sentinel Curator Audit Report

Дата: 2026-05-19  
Проект: `Risk Sentinel`  
Папка: `C:\Users\HP\Desktop\ryptoooo`

## Executive Summary

Для проекта были подняты 4 экспертных исследовательских агента-куратора:

1. **Meitner** — DeFi Protocol & Financial Risk Curator.
2. **Rawls** — Backend, Data & Worker Reliability Curator.
3. **Ohm** — Security, Abuse & Operations Curator.
4. **Kepler** — Product, Frontend & QA Curator.
5. **Sagan** — Aave V3 & DeFi Lending Protocol Specialist.
6. **Kuhn** — DeFi Liquidation, Oracle & Rescue Strategy Specialist.

Все агенты проверяли проект независимо и без правок. Ruflo MCP был недоступен (`Transport closed`), поэтому аудит выполнен через локальный код, тесты, review tooling и проектные файлы.

Текущий вывод панели: проект уже является рабочей инженерной базой, но **не готов к production**. Есть critical/high blockers, которые нужно закрыть до публичного использования.

## Validation Snapshot

Подтверждено агентами:

- `npm test` проходит: 15 tests passed.
- `npm run build` проходит в текущем окружении, но есть warnings.
- Сборка/локальный dev зависят от Windows/Next SWC warning.
- Secret scan не нашел реальных секретов в проектных файлах.
- Dependency audit: moderate advisories есть, high/critical advisories не отмечены агентом Security.

Known warnings:

- Next SWC native binary warning on Windows.
- `viem/ox tempo` critical dependency warning.
- Ruflo MCP transport closed.

## Critical Blockers

### 1. Public Watch CRUD Without Auth/Ownership

Owner: Security Curator / Backend Curator  
Severity: Critical

Problem:

- `GET /api/watches` returns all active watches.
- `PATCH /api/watches/[id]` and `DELETE /api/watches/[id]` only check id existence.
- `userId` exists in schema but is not enforced as an access boundary.

Impact:

- Wallet and Telegram chat ID privacy leak.
- Attackers can disable or modify watches.
- Attackers can tamper thresholds and Telegram setup.

Required fix:

- Add authentication.
- Scope every watch query/update/delete by authenticated `userId`.
- In production, never return all watches globally.

Status:

- Temporary user boundary added via `x-risk-sentinel-user-id`, `risk_sentinel_user_id` cookie, and local demo `RISK_SENTINEL_DEV_USER_ID`.
- `GET /api/watches`, `POST /api/watches`, `PATCH /api/watches/[id]`, `DELETE /api/watches/[id]`, and dashboard list are scoped by user ID.
- Cross-user list/patch/delete denial is covered by integration tests.
- Still needed before paid beta: replace temporary boundary with a real auth provider/session system.

### 2. Silent In-Memory Fallback Can Lose Production Data

Owner: Backend Curator / Security Curator  
Severity: Critical/High

Problem:

- `getDb()` returns `null` when `DATABASE_URL` is missing.
- Repository silently writes to process memory.

Impact:

- Watches, snapshots, and alert history disappear after restart/cold start.
- Monitoring promise becomes false in production.

Required fix:

- Fail fast in production if `DATABASE_URL` is missing.
- Allow memory mode only for tests/local demo via explicit env flag.

### 3. Cron Lock Is Process-Local

Owner: Backend Curator  
Severity: Critical/High

Problem:

- `lib/workers/locks.ts` uses a module-level boolean.
- This only protects one Node process.

Impact:

- Multi-instance/serverless cron can process same watch concurrently.
- Duplicate snapshots and Telegram alerts.
- RPC bursts and alert spam.

Required fix:

- Use Postgres advisory lock, Redis lock, or leased worker-run table.
- Add tests for concurrent cron behavior.

### 4. Alert Send Is Not Idempotent

Owner: Backend Curator  
Severity: Critical

Problem:

- Telegram send happens before durable idempotency marker/outbox state.
- If process crashes after send but before persistence, next run may resend.

Impact:

- Duplicate alerts and user trust damage.

Required fix:

- Add alert outbox or idempotency key.
- Persist pending event before send.
- Mark sent/failed with attempts and retry metadata.

### 5. Collateral Rescue Estimate Uses Floor Division

Owner: DeFi Protocol Curator  
Severity: Critical

Problem:

- `collateralToTargetBase` uses floor integer division.
- User-facing collateral estimate can be too low by 1 base unit or more.

Impact:

- UI/Telegram may say “add X collateral” while HF stays below target.

Required fix:

- Use ceiling division for collateral addition estimates.
- Add tests proving conservative rounding.

### 6. Base-Unit Semantics Are Not User-Safe

Owner: DeFi Protocol Curator / Product Curator  
Severity: Critical

Problem:

- Aave account data returns base currency values.
- UI/Telegram show raw integer values as “base units”.
- No market reference currency decimals, USD/ETH label, or asset conversion.

Impact:

- User may misunderstand rescue amount.

Required fix:

- Clearly label raw base currency values.
- Add inline warning: estimate, not transaction quote.
- Add market reference currency metadata before human-readable amounts.

### 7. User Alert Threshold Can Be Ignored When Global Risk Band Is Safe

Owner: DeFi Liquidation & Rescue Strategy Specialist  
Severity: Critical

Problem:

- Alert engine suppresses alerts early for `safe`.
- `safe` is derived from global HF band `HF >= 1.5`.
- If a user configures `minHealthFactor = 1.8` and current HF is `1.6`, the user expects an alert, but global classification is `safe`, so alert may be suppressed.

Impact:

- User-specific risk policy is not honored.
- Product promise “your threshold” is violated.

Required fix:

- Evaluate user `minHealthFactor` before global safe/watch suppression.
- Add tests for `HF < minHealthFactor` while global band is `safe`.

### 8. Aave Adapter Is HF-Correct But Not Sufficient For Minimum Token-Level Rescue

Owner: Aave V3 & DeFi Lending Protocol Specialist  
Severity: High

Problem:

- Adapter reads `Pool.getUserAccountData`, which is enough for aggregate HF.
- Rescue calculator returns base-currency estimates only.
- It does not know debt asset, collateral asset, oracle price, decimals, liquidation bonus, reserve state, or action feasibility.

Impact:

- Product cannot honestly claim “minimum repay/add-collateral action” in real token terms yet.

Required fix:

- Mark current rescue plan as planning estimate only.
- Add asset-level Aave position/reserve data before token-specific rescue guidance.

### 9. Aave V3 Semantic Modes Are Missing

Owner: Aave V3 & DeFi Lending Protocol Specialist  
Severity: High

Missing:

- user eMode
- isolation mode
- siloed borrowing
- paused/frozen reserves
- oracle grace/sentinel state
- reserve configuration bitmap
- liquidation bonus and close-factor regimes

Impact:

- System can report aggregate HF, but cannot explain why the position is dangerous or which actions are unavailable.

Required fix:

- Extend Aave adapter with user configuration, reserve list, reserve data/configuration, user eMode, eMode category, oracle/source metadata.

## High Findings

### No Rate Limiting

Owner: Security Curator

Affected:

- `/api/check`
- `/api/watches`
- `/api/telegram/webhook`
- cron endpoint

Impact:

- RPC quota burn.
- DB growth.
- Wallet enumeration.
- App-level DoS.

Required fix:

- Add Redis/Postgres/in-memory local rate limiter.
- Enforce stricter production limits.

### No Reliable Lint Gate

Owner: Product/QA Curator

Problem:

- `npm run lint` points to `next lint`, which is deprecated/interactively configured in this setup.

Required fix:

- Add non-interactive ESLint config.
- Make `npm run lint` pass in CI.

### No Browser/E2E Validation

Owner: Product/QA Curator

Problem:

- Tests are node-only.
- No Playwright/Cypress/browser smoke.

Required fix:

- Add browser smoke for `/`, `/wallets`, `/dashboard`, `/pricing`.
- Validate forms, hydration, console errors, mobile viewport, and accessibility basics.

### Wallet Connect Is Not Integrated Into User Flow

Owner: Product/QA Curator

Problem:

- Connected wallet address is displayed but not actionable.
- No “use this address” flow for risk check/watch creation.
- No connect error state or chain mismatch handling.

Required fix:

- Let user fill check/watch form from connected wallet.
- Add error and unsupported wallet states.

### Aave Adapter Correctness Not Proven With Live/Fork Tests

Owner: DeFi Protocol Curator

Problem:

- ABI shape is plausible and tests mock the adapter.
- No live/fork test vectors against known wallets/Aave UI/math-utils.

Required fix:

- Add optional live RPC smoke tests gated by env vars.
- Verify pool addresses against official Aave address-book.

### Protocol Adapter Interface Is Too Aave-Shaped

Owner: Aave V3 & DeFi Lending Protocol Specialist

Problem:

- `PositionRisk` assumes Health Factor, LTV, liquidation threshold, base debt/collateral.
- Morpho Blue, Euler, Fluid, and other lending protocols may not fit this shape safely.

Required fix:

- Redesign around generic `AccountRisk`, `MarketRiskContribution`, and `ProtocolSemantics`.
- Each adapter must declare unit semantics, liquidation trigger, oracle source, unsupported states, and rescue assumptions.

### Oracle/Stale Data Risk Is Not Modeled

Owner: DeFi Liquidation & Rescue Strategy Specialist

Problem:

- Current adapter relies on successful `getUserAccountData`.
- No block timestamp, data age, provider identity, stale cutoff, oracle sentinel status, or cross-source sanity check.
- `readContract` and `getBlockNumber` are not tied to the same block.

Required fix:

- Store `blockNumber`, `blockTimestamp`, `dataAgeSeconds`, RPC provider identity, and stale/degraded status.
- Add explicit unknown/stale-data alert policy.

## Medium Findings

### Dashboard Is Not Monitoring-Useful Enough

Owner: Product/QA Curator

Current dashboard shows config fields only.

Missing:

- latest HF
- current risk level
- latest alert status
- last error
- next check
- edit/pause/delete actions
- empty state

### Alert History Is Placeholder

Owner: Product/QA Curator / Backend Curator

`AlertHistory.tsx` does not render real alert events.

Required fix:

- Add alert events query.
- Render sent/suppressed/failed history.

### Form Error Handling Is Raw

Owner: Product/QA Curator

Problem:

- UI displays raw `JSON.stringify(json.error)`.
- Network failures can leave pending state fragile.

Required fix:

- Add `try/finally`.
- Add human-readable error mapping.
- Add `aria-live` or alert roles.

### Telegram Webhook Is Unauthenticated

Owner: Security Curator

Current endpoint accepts arbitrary JSON.

Required fix:

- Verify Telegram secret token/header.
- Add verified chat binding flow.

### Logger Redaction Is Key-Blind

Owner: Security Curator

Problem:

- Redaction checks value text, not metadata key.

Required fix:

- Redact by key and value.
- Add tests for `cronSecret`, `telegramBotToken`, `databaseUrl`, etc.

### Alert Payload Stores Full Text

Owner: Security/Backend Curator

Problem:

- `payloadJson` stores full Telegram text.

Required fix:

- Store template id/hash/minimal metadata unless retention requires full payload.

### Latest Snapshot Query Is Nondeterministic In Postgres

Owner: Backend Curator

Problem:

- `getLastSnapshotForWatch` uses `limit(1)` without deterministic `createdAt desc`.

Required fix:

- Restore deterministic ordering in Postgres query.
- Add test.

## Already Addressed During Agent Setup

### `.swarm/` Publish Hygiene

Security agent flagged `.swarm/` as untracked and dangerous to publish.

Action taken:

- Added `.swarm/` to `.gitignore`.
- Added `tsconfig.tsbuildinfo` to `.gitignore`.

Status:

- Addressed in commit `5052149`.

## Recommended Remediation Order

### Phase 0: Immediate Safety Fixes

1. Fix collateral ceiling division. **Addressed in current Phase 0 patch.**
2. Fix alert engine so user `minHealthFactor` overrides global safe band. **Addressed in current Phase 0 patch.**
3. Fail closed in production when `DATABASE_URL` is missing. **Addressed in current Phase 0 patch.**
4. Add auth/user ownership boundary for watch CRUD. **Temporary scoped boundary addressed; real auth provider still pending.**
5. Add `.swarm/` ignore commit. **Addressed in commit `5052149`.**
6. Fix deterministic latest snapshot ordering. **Addressed in current Phase 0 patch.**
7. Add non-interactive lint gate. **Addressed in current Phase 0 patch.**

### Phase 1: Reliability Hardening

1. Add distributed cron lock. **Addressed for Postgres deployments with `pg_try_advisory_lock`; in-memory fallback remains only for test/demo mode.**
2. Add alert idempotency/outbox.
3. Add due predicate for watches.
4. Add Telegram retry/backoff and failure status.
5. Add worker run audit table.

### Phase 2: Security And Abuse Controls

1. Rate limit public endpoints. **Local in-memory limiter added for `/api/check` and `POST /api/watches`; production still needs distributed Redis/Upstash limiting for multi-instance deployments.**
2. Add Telegram webhook verification.
3. Tighten Telegram chat ID validation/binding.
4. Improve logger redaction.
5. Add CI with test/build/lint/audit.

### Phase 3: Product And QA

1. Add browser/e2e smoke tests.
2. Improve wallet connect flow.
3. Add latest HF/risk/alert status to dashboard.
4. Add real alert history.
5. Improve form error UX and accessibility.

### Phase 4: DeFi Correctness

1. Verify Aave pool constants against address-book. **Addressed with `@aave-dao/aave-address-book`; regression test pins supported chain pool constants to the package exports.**
2. Add optional live RPC/fork smoke checks.
3. Add base currency decimals/reference metadata.
4. Add more edge-case math tests.
5. Document unsupported Aave nuances.
6. Extend Aave adapter for user/reserve configuration and eMode/isolation semantics.
7. Redesign protocol adapter interface before adding Morpho/Euler/Fluid.

## Production Readiness Decision

Current status: **Not production-ready**.

Allowed use:

- local development
- technical demo
- internal review
- architecture iteration

Not allowed yet:

- public beta
- real user monitoring promises
- paid launch
- unattended production cron
- claims of financial decision accuracy

## Curator Ownership

Meitner owns DeFi correctness and protocol risk.

Rawls owns backend, database, worker reliability, and migrations.

Ohm owns security, abuse control, secrets, CI/CD, and operational risk.

Kepler owns product UX, frontend quality, browser testing, accessibility, and release checklist.

Sagan owns Aave V3 lending semantics, address-book verification, reserve/user configuration coverage, and protocol adapter correctness.

Kuhn owns liquidation/oracle/rescue strategy, stale-data policy, market-risk assumptions, and future execution safety boundaries.

Every future major change should be reviewed by the relevant curator before being considered ready.

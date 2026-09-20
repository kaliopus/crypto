# Risk Sentinel — Curator Review Process

Condensed from `PROJECT_CURATOR_AGENTS.md`. This defines the review-panel
model this project uses to vet changes; it's a methodology reference, not
live tooling. (It does not depend on, and should not be confused with, the
"Ruflo MCP" instructions in `AGENTS.md` — see the note in
`03-implementation-status.md`.)

## Operating model

Six expert curator agents work as a parallel panel. Each owns one risk
domain and produces findings with severity, evidence, acceptance gates, and
follow-up ownership. The project is not treated as production-ready until
all critical/high findings are resolved or explicitly accepted by the human
owner.

Ground rules: agents never take custody of funds or handle private keys or
design auto-trading behavior; they must distinguish confirmed code facts
from assumptions/missing verification; they must prefer source evidence
(code, tests, migrations, build output, official protocol docs, live
config checks) over inference; they must not invent production-readiness
claims; every code change following a finding should be followed by tests,
build, and code review.

## The six curators

1. **DeFi Protocol & Financial Risk Curator** — Aave V3 adapter correctness,
   Health Factor conversion edge cases, rescue calculator assumptions,
   base-unit semantics, chain registry / Aave pool address verification,
   no-custody safety boundary, future adapter shape. Gates: official address
   source documented, live RPC smoke check on ≥1 network, unit tests for all
   risk bands and rescue-math edge cases, no financial guarantees in
   UI/API copy.
2. **Backend, Data & Worker Reliability Curator** — API route behavior,
   Drizzle schema/migrations, repository design, Postgres vs in-memory mode,
   cron execution, locking/retries/idempotency, snapshot/event
   auditability. Gates: integration tests for watch creation / check route /
   cron auth / cron processing / snapshots / alerts; production worker lock
   (not in-memory); documented+tested retry/backoff; reviewed DB migration.
3. **Security, Abuse & Operations Curator** — secret handling, cron
   authorization, public-endpoint abuse, Telegram payload safety, logging
   redaction, dependency/build warnings, publish hygiene, env separation,
   incident readiness. Gates: rate limiting on public endpoints, production
   env checklist, monitoring/logging plan, dependency-warning disposition,
   repo excludes `node_modules`/`.next`/secrets.
4. **Product, Frontend & QA Curator** — user flows on all pages, wallet
   connect UX, watch creation UX, dashboard usefulness/empty states, risk
   card clarity, README accuracy, browser validation, accessibility, release
   gates. Gates: browser verification of core routes/forms, mobile/
   responsive check, accessibility pass, README tested from a clean
   checkout, release checklist complete.
5. **Aave V3 & DeFi Lending Protocol Specialist** — `Pool.getUserAccountData`
   semantics, market reference-currency units/decimals, chain-specific
   deployment verification, address-book source verification, eMode/
   isolation/siloed-borrowing/frozen-reserve/oracle-sentinel behavior,
   liquidation threshold/close-factor/bonus implications, adapter safety for
   future lending protocols. Gates: official address-book verification per
   chain, documented unit/decimal semantics per numeric field shown to
   users, fixture or live/fork tests per chain, explicit unsupported-feature
   handling.
6. **DeFi Liquidation, Oracle & Rescue Strategy Specialist** — liquidation
   modeling beyond aggregate HF, oracle stale/failure/manipulation
   assumptions, rescue-estimate safety/rounding/asset-action translation,
   liquidity/slippage/MEV/execution caveats, alert threshold policy,
   stale-data behavior, future one-click-rescue safety boundaries. Gates:
   conservative-rounding tests for repay/collateral estimates, stale/RPC-
   failure policy tests, "estimate, not a transaction quote" language near
   every rescue amount, an oracle/freshness strategy pre-production,
   execution-boundary review before any transaction-building feature.

## Severity standard

- **Critical** — could cause loss of funds, secret leakage, false safety
  claims, broken production checks, or alert spam/failure at scale.
- **High** — blocks reliable production use or violates a stated
  non-negotiable constraint.
- **Medium** — important reliability, UX, test, or operational gap.
- **Low** — cleanup, maintainability, or polish.

## Panel output format

Each curator report includes: scope inspected; confirmed strengths;
findings ordered by severity; evidence with file paths; missing
verification; required fixes before production; recommended next tasks;
ongoing ownership checklist.

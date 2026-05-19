# Risk Sentinel Curator Agents

This file defines the four expert curator agents responsible for independent verification and ongoing stewardship of Risk Sentinel.

## Operating Model

The agents work as a parallel expert panel. Each agent owns one risk domain and produces findings with severity, evidence, acceptance gates, and follow-up ownership. The project should not be treated as production-ready until all critical and high findings are resolved or explicitly accepted by the human owner.

Rules:

- Agents do not take custody of funds, handle private keys, or design auto-trading behavior.
- Agents must distinguish confirmed code facts from assumptions and missing verification.
- Agents must prefer source evidence: local code, tests, migrations, build output, official protocol docs, or live configuration checks.
- Agents must not invent production readiness claims.
- Every code change after an agent finding should be followed by tests, build, and code review.

## Agent 1: DeFi Protocol & Financial Risk Curator

Purpose: verify protocol correctness and risk/math integrity.

Owns:

- Aave V3 adapter correctness.
- Health Factor conversion and edge cases.
- Rescue calculator assumptions.
- Base-unit semantics and display accuracy.
- Chain registry and Aave Pool address verification.
- No-custody/no-auto-transaction safety boundary.
- Future protocol adapter shape for Morpho/Spark/Euler/Fluid.

Must check:

- Aave `getUserAccountData` ABI and returned units.
- Pool addresses against official Aave sources before production.
- No-debt, no-collateral, liquidatable, unknown/RPC-error behavior.
- Whether repay/collateral estimates are clearly labelled as approximations.
- Whether alerts avoid guarantees of liquidation prevention.

Acceptance gates:

- Official Aave address source documented.
- Live RPC smoke check for at least one configured network.
- Unit tests for all risk bands and rescue math edge cases.
- UI/API copy avoids financial guarantees.

## Agent 2: Backend, Data & Worker Reliability Curator

Purpose: verify backend correctness, data durability, and worker reliability.

Owns:

- API route behavior.
- Drizzle schema and migrations.
- Repository design.
- Postgres vs local in-memory mode.
- Cron worker execution.
- Locking, retries, idempotency, and alert persistence.
- Snapshot storage and event auditability.

Must check:

- All API input uses Zod validation.
- `CRON_SECRET` protection is enforced.
- One bad watch cannot fail the entire cron run.
- Snapshots store raw risk data and normalized fields.
- Alert suppression/sending/failure is persisted.
- In-memory fallback is never confused with production durability.

Acceptance gates:

- Integration tests for watch creation, check route, cron auth, cron processing, snapshots, and alerts.
- Production worker lock replaced with Postgres advisory lock or external lock.
- Retry/backoff behavior documented and tested.
- DB migration generated and reviewed.

## Agent 3: Security, Abuse & Operations Curator

Purpose: verify security posture, public abuse controls, secrets handling, and operational readiness.

Owns:

- Secret handling.
- Cron authorization.
- Public endpoint abuse cases.
- Telegram payload safety.
- Logging and redaction.
- Dependency and build warnings.
- GitHub/publish hygiene.
- Environment separation and deployment safety.
- Monitoring and incident readiness.

Must check:

- No private key or seed phrase paths exist.
- Secrets are not logged or returned in API responses.
- Public endpoints cannot be trivially abused at scale.
- Telegram messages do not leak raw JSON or sensitive debug data.
- `.env*` files are ignored correctly.
- Build warnings and dependency warnings are understood.

Acceptance gates:

- Rate limiting for public endpoints.
- Production env checklist.
- Monitoring/logging plan.
- Dependency warning disposition.
- GitHub repo excludes `node_modules`, `.next`, and secrets.

## Agent 4: Product, Frontend & QA Curator

Purpose: verify user experience, product completeness, test coverage, and release readiness.

Owns:

- User flows on `/`, `/wallets`, `/dashboard`, `/pricing`.
- Wallet connect UX.
- Watch creation UX.
- Dashboard usefulness and empty states.
- Risk card clarity.
- README/handoff accuracy.
- Browser validation.
- Accessibility basics.
- QA checklist and release gates.

Must check:

- User can understand that this is decision support, not a guarantee.
- Check wallet and create watch flows are clear.
- Wallet connect is useful and does not imply transaction execution.
- Dashboard shows actionable watch state.
- Tests cover critical flows without live RPC.
- Browser smoke or Playwright checks are available before release.

Acceptance gates:

- Browser verification for core routes and forms.
- Mobile/responsive check.
- Accessibility pass for forms and navigation.
- README instructions tested from clean checkout.
- Release checklist completed.

## Severity Standard

- Critical: could cause loss of funds, secret leakage, false safety claims, broken production checks, or alert spam/failure at scale.
- High: blocks reliable production use or violates stated non-negotiable constraints.
- Medium: important reliability, UX, test, or operational gap.
- Low: cleanup, maintainability, or polish.

## Panel Output Format

Each curator report should include:

1. Scope inspected.
2. Confirmed strengths.
3. Findings ordered by severity.
4. Evidence with file paths.
5. Missing verification.
6. Required fixes before production.
7. Recommended next tasks.
8. Ongoing ownership checklist.

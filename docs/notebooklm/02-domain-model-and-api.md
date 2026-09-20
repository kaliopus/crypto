# Risk Sentinel — Domain Model & API

## Database schema (Drizzle / PostgreSQL)

### `users`
`id` (uuid pk), `email` (nullable unique), `telegramChatId` (nullable),
`createdAt`, `updatedAt`.

### `watches`
`id`, `userId` (fk → users), `walletAddress`, `chainKey`
(`ethereum | base | arbitrum | optimism`), `protocolKey` (`aave-v3` in V0),
`minHealthFactor` (default 1.25), `targetHealthFactor` (default 1.40),
`telegramChatId`, `alertCooldownMinutes` (default 30), `isActive`,
`lastCheckedAt`, `lastAlertedAt`, `createdAt`, `updatedAt`.
Indexes: `(isActive, lastCheckedAt)`, `(walletAddress, chainKey, protocolKey)`.

### `risk_snapshots`
`id`, `watchId` (fk), `walletAddress`, `chainKey`, `protocolKey`,
`blockNumber`, `healthFactor`, `healthFactorRaw`, `totalCollateralBase`,
`totalDebtBase`, `currentLiquidationThreshold`, `ltv`, `availableBorrowsBase`,
`riskLevel` (`none | safe | watch | warning | critical | liquidatable |
unknown`), `dangerReason`, `repayToTargetBase`, `collateralToTargetBase`,
`rawJson`, `createdAt`.
Indexes: `(watchId, createdAt desc)`, `(chainKey, protocolKey, createdAt
desc)`, `(riskLevel, createdAt desc)`.

### `alert_events`
`id`, `watchId` (fk), `snapshotId` (fk, nullable), `channel` (`telegram |
email | discord | webhook`), `status` (`sent | suppressed | failed`),
`reason`, `payloadJson`, `createdAt`.

### `billing_subscriptions`
`id`, `userId` (fk), `provider` (default `stripe`), `providerCustomerId`,
`providerSubscriptionId`, `status` (default `free`), `planKey` (default
`free`), `currentPeriodEnd`, `createdAt`, `updatedAt`.

## Protocol adapter interface

```ts
export type ProtocolKey = 'aave-v3' | 'morpho-blue';

export type PositionRisk = {
  protocolKey: ProtocolKey;
  chainKey: string;
  walletAddress: `0x${string}`;
  blockNumber?: bigint;
  healthFactor: number | null;
  totalCollateralBase?: bigint;
  totalDebtBase?: bigint;
  availableBorrowsBase?: bigint;
  currentLiquidationThreshold?: bigint;
  ltv?: bigint;
  riskLevel: 'none'|'safe'|'watch'|'warning'|'critical'|'liquidatable'|'unknown';
  dangerReason: string;
  rescuePlan?: RescuePlan;
  raw: unknown;
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

The Aave V3 adapter calls `Pool.getUserAccountData(address)` via viem and
returns `totalCollateralBase`, `totalDebtBase`, `availableBorrowsBase`,
`currentLiquidationThreshold`, `ltv`, `healthFactor`, `blockNumber`.
`healthFactor` is a WAD-style fixed-point value — the raw bigint string is
preserved in the DB, converted carefully for display.

Edge cases the adapter must handle: no debt (→ `none`/`safe`, no rescue
plan), no collateral and no debt (→ `none`), HF < 1 (→ `liquidatable`), RPC
error (→ `unknown`, with error metadata stored).

## Risk scoring

```txt
DEFAULT_THRESHOLDS = { watch: 1.5, warning: 1.25, critical: 1.1, liquidatable: 1.0 }

no debt                         => none
HF >= watch (1.5)                => safe
warning <= HF < watch            => watch
critical <= HF < warning         => warning
liquidatable <= HF < critical    => critical
HF < liquidatable (1.0)          => liquidatable
unknown/error                    => unknown
```

A user's own `minHealthFactor` must be able to trigger an alert even when the
global classification says `safe`/`watch` — the alert engine must check the
user's threshold *before* applying global suppression.

## Rescue calculator

```txt
HF = collateralAdjusted / debt
collateralAdjusted = totalCollateralBase * currentLiquidationThreshold / 10000
```

Repay estimate, given target HF `T`:

```txt
requiredDebtAfter = collateralAdjusted / T
repayNeeded = max(0, totalDebtBase - requiredDebtAfter)
```

Collateral addition estimate (approximation — assumes new collateral has the
same effective liquidation threshold as the current weighted position):

```txt
requiredCollateralAdjusted = totalDebtBase * T
additionalAdjustedCollateral = max(0, requiredCollateralAdjusted - collateralAdjusted)
additionalCollateralBase = additionalAdjustedCollateral / weightedLiquidationThreshold
```

Collateral addition must be labeled as an approximation and use **ceiling**
division (not floor) so the estimate never understates the action needed.

## API endpoints

- `GET /api/health` → `{ ok: true, service: "risk-sentinel", time }`
- `GET /api/check?chain=base&wallet=0x...&protocol=aave-v3&targetHealthFactor=1.4`
  → current risk without creating a watch.
- `POST /api/watches` → create a watch (also runs one immediate check).
- `GET /api/watches` → list the caller's active watches (scoped by user).
- `PATCH /api/watches/[id]` → update threshold/target HF/Telegram chat
  id/active status.
- `DELETE /api/watches/[id]` → soft-disable (`isActive=false`).
- `GET /api/cron/check-watches` → `Authorization: Bearer $CRON_SECRET`.
  Acquires a lock, loads due watches, checks each with a concurrency limit
  (`p-limit`, 5), stores a snapshot, decides on/sends alerts, updates
  `lastCheckedAt`/`lastAlertedAt`, returns a run summary
  (`{ ok, checked, alertsSent, alertsSuppressed, failed }`).
- `POST /api/telegram/webhook` → verified with `TELEGRAM_WEBHOOK_SECRET`
  (Telegram `secret_token` header).
- `POST /api/billing/checkout` → Stripe scaffold, currently a stub.

### curl examples

```bash
curl http://localhost:3000/api/health

curl "http://localhost:3000/api/check?chain=base&wallet=0x0000000000000000000000000000000000000001&protocol=aave-v3&targetHealthFactor=1.4"

curl -X POST http://localhost:3000/api/watches \
  -H "content-type: application/json" \
  -d '{"walletAddress":"0x0000000000000000000000000000000000000001","chainKey":"base","protocolKey":"aave-v3","minHealthFactor":1.25,"targetHealthFactor":1.4}'

curl http://localhost:3000/api/cron/check-watches \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Telegram alert template

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

No secrets, raw JSON, or debug info in alert text. Cooldown logic: never
alert with no Telegram chat id; never alert for `none`/`safe`; always alert
on a worsening risk level; alert when HF is below the user's threshold and
cooldown has passed; otherwise store a `suppressed` alert event with a
reason.

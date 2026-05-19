# Risk Sentinel Handoff Report

Дата отчёта: 2026-05-19  
Проект: `Risk Sentinel`  
Папка: `C:\Users\HP\Desktop\ryptoooo`  
Назначение отчёта: передать другому ChatGPT/ревьюеру детальную картину того, что было реализовано, как устроена система, что проверено, и какие ограничения ещё остаются.

## 1. Исходная задача

В папке был один файл с техническим заданием:

- `risk_sentinel_codex_prompt.md`

Задача: реализовать production-oriented MVP под названием **Risk Sentinel**.

Продуктовая цель:

> Risk Sentinel monitors DeFi borrow/leverage positions and warns users before liquidation risk becomes critical.

V0 должен начинаться с Aave V3 и быть расширяемым под Morpho, Spark, Euler, Fluid и будущие execution modules.

Жёсткие ограничения из ТЗ:

- TypeScript everywhere.
- Next.js App Router.
- `viem` для EVM/RPC.
- Никаких private keys.
- Никакого custody.
- Никаких auto-transactions в V0.
- Никаких smart contract deployments.
- Zod validation на API input.
- Cron endpoint под `CRON_SECRET`.
- Store raw risk snapshots.
- Telegram alerts.
- Drizzle + PostgreSQL schema.
- Модульная архитектура под будущие protocol adapters.
- Тесты без live RPC в CI.

## 2. Что было реализовано

Создан полноценный Next.js/TypeScript проект в текущей папке.

Основные файлы проекта:

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `vitest.config.ts`
- `drizzle.config.ts`
- `.env.example`
- `README.md`
- `lib/db/migrations/0000_wakeful_sentry.sql`

## 3. Frontend

Реализованы страницы:

- `/` — landing + быстрый watch form.
- `/dashboard` — таблица watches + форма создания watch + блок alert history.
- `/wallets` — one-off wallet risk check + wallet connect panel.
- `/pricing` — billing scaffold.

Компоненты:

- `components/WatchForm.tsx`
- `components/RiskCard.tsx`
- `components/PositionTable.tsx`
- `components/ChainBadge.tsx`
- `components/AlertHistory.tsx`
- `components/RescuePlanCard.tsx`
- `components/Providers.tsx`
- `components/WalletConnectPanel.tsx`

Добавлен `wagmi`/TanStack provider:

- `components/Providers.tsx`
- `lib/wallet/wagmi.ts`

Wallet connect:

- Используется `wagmi` injected connector.
- Поддерживается подключение injected EVM wallet.
- Wallet connect используется только для address handling.
- Нет подписи транзакций.
- Нет request private key.
- Нет auto-trading.

## 4. API endpoints

Реализованы route handlers:

- `GET /api/health`
- `GET /api/check`
- `GET /api/watches`
- `POST /api/watches`
- `PATCH /api/watches/[id]`
- `DELETE /api/watches/[id]`
- `GET /api/cron/check-watches`
- `POST /api/telegram/webhook`
- `POST /api/billing/checkout`

Ключевые файлы:

- `app/api/health/route.ts`
- `app/api/check/route.ts`
- `app/api/watches/route.ts`
- `app/api/watches/[id]/route.ts`
- `app/api/cron/check-watches/route.ts`
- `app/api/telegram/webhook/route.ts`
- `app/api/billing/checkout/route.ts`

## 5. Validation

Вся основная валидация вынесена в:

- `lib/validation/schemas.ts`

Схемы:

- `chainKeySchema`
- `protocolKeySchema`
- `walletAddressSchema`
- `healthFactorSchema`
- `checkQuerySchema`
- `createWatchSchema`
- `updateWatchSchema`

Проверяется:

- EVM wallet address format.
- supported chain.
- protocol key.
- min Health Factor / target Health Factor bounds.
- update watch payload.

## 6. Chain registry

Реализован typed chain registry:

- `lib/chains.ts`

Поддерживаемые сети V0:

- Ethereum
- Base
- Arbitrum
- Optimism

Типы:

- `ChainKey`
- `ChainConfig`

Helpers:

- `getChainConfig(chainKey)`
- `getRpcUrl(chainKey)`

RPC client вынесен отдельно, чтобы UI не тянул server/RPC code:

- `lib/rpc/client.ts`

## 7. Aave V3 integration

Реализован Aave V3 adapter:

- `lib/protocols/aave/client.ts`
- `lib/protocols/aave/constants.ts`
- `lib/protocols/aave/risk.ts`

Функция:

```ts
getAaveUserAccountData(input: {
  chainKey: ChainKey;
  walletAddress: `0x${string}`;
})
```

Вызывает Aave V3 Pool:

- `getUserAccountData(address)`

Возвращает:

- `totalCollateralBase`
- `totalDebtBase`
- `availableBorrowsBase`
- `currentLiquidationThreshold`
- `ltv`
- `healthFactor`
- `blockNumber`

Важно:

- В `constants.ts` добавлены explicit Aave V3 Pool addresses.
- В коде оставлен комментарий, что перед production их надо сверить с official Aave docs или Aave address-book.
- Live сверка адресов с официальным address-book не выполнялась.

## 8. Protocol adapter interface

Реализован общий interface:

- `lib/protocols/types.ts`

Типы:

- `ProtocolKey`
- `RiskLevel`
- `RescuePlan`
- `PositionRisk`
- `ProtocolAdapter`

Есть placeholder под Morpho:

- `lib/protocols/morpho/README.md`

`lib/risk/engine.ts` умеет выбирать adapter по `protocolKey`.

Также добавлена test-only injection:

- `__setProtocolAdapterForTests`

Это нужно, чтобы integration tests не зависели от live RPC.

## 9. Risk scoring

Реализовано:

- `lib/risk/thresholds.ts`

Risk levels:

- `none`
- `safe`
- `watch`
- `warning`
- `critical`
- `liquidatable`
- `unknown`

Логика:

- no debt => `none`
- HF >= 1.5 => `safe`
- 1.25 <= HF < 1.5 => `watch`
- 1.1 <= HF < 1.25 => `warning`
- 1.0 <= HF < 1.1 => `critical`
- HF < 1.0 => `liquidatable`
- failed/incomplete check => `unknown`

## 10. Rescue calculator

Реализовано:

- `lib/risk/rescue.ts`

Функции:

- `healthFactorFromRaw`
- `calculateRescuePlan`

Формулы:

```txt
HF = collateralAdjusted / debt
collateralAdjusted = totalCollateralBase * currentLiquidationThreshold / 10000
```

Repay estimate:

```txt
requiredDebtAfter = collateralAdjusted / targetHF
repayNeeded = max(0, totalDebtBase - requiredDebtAfter)
```

Collateral addition estimate:

```txt
requiredCollateralAdjusted = totalDebtBase * targetHF
additionalAdjustedCollateral = max(0, requiredCollateralAdjusted - collateralAdjusted)
additionalCollateralBase = additionalAdjustedCollateral / weightedLiquidationThreshold
```

В коде явно указано, что collateral addition approximation зависит от asset-specific liquidation threshold.

## 11. Database

Drizzle schema:

- `lib/db/schema.ts`

Tables:

- `users`
- `watches`
- `risk_snapshots`
- `alert_events`
- `billing_subscriptions`

Migration:

- `lib/db/migrations/0000_wakeful_sentry.sql`

Repository:

- `lib/db/repository.ts`

Особенность реализации:

- Если `DATABASE_URL` задан, используется Postgres через Drizzle.
- Если `DATABASE_URL` не задан, используется in-memory fallback.

Это сделано, чтобы локальный dev/demo и тесты работали без поднятого Postgres.

Production note:

- in-memory mode не является durable storage.
- Для production нужен `DATABASE_URL` и `npm run db:migrate`.

## 12. Telegram alerts

Реализовано:

- `lib/alerts/telegram.ts`
- `lib/alerts/templates.ts`
- `lib/alerts/engine.ts`

Функция отправки:

```ts
sendTelegramMessage(input: {
  chatId: string;
  text: string;
})
```

Поведение:

- Если `TELEGRAM_BOT_TOKEN` не задан, отправка возвращает controlled failure.
- Secrets не логируются.
- Message template не включает raw JSON или sensitive debug info.
- Alert events сохраняются со статусами:
  - `sent`
  - `suppressed`
  - `failed`

Cooldown logic:

- Не отправляет alert без Telegram chat ID.
- Не отправляет alert для `none`/`safe`.
- Отправляет alert при ухудшении risk level.
- Отправляет alert если HF ниже пользовательского threshold и cooldown прошёл.
- Иначе сохраняет suppressed alert event.

Для тестов добавлен override:

- `__setTelegramSenderForTests`

## 13. Worker / Cron

Worker:

- `lib/workers/checkWatches.ts`

Lock:

- `lib/workers/locks.ts`

Endpoint:

- `GET /api/cron/check-watches`

Protection:

- `Authorization: Bearer ${CRON_SECRET}`

Worker behavior:

- Загружает due watches.
- Проверяет каждый watch через risk engine.
- Stores risk snapshot.
- Решает, отправлять ли alert.
- Отправляет Telegram alert или сохраняет suppressed event.
- Обновляет `lastCheckedAt` и `lastAlertedAt`.
- Не даёт одному bad watch уронить весь run.

Concurrency:

- Используется `p-limit` с лимитом 5.

Lock:

- Сейчас in-memory lock.
- Для production лучше Postgres advisory lock или external lock.

## 14. Billing

Billing scaffold:

- `lib/billing/stripe.ts`
- `app/api/billing/checkout/route.ts`
- `app/pricing/page.tsx`

Сейчас checkout stub.

Это соответствует допущению из ТЗ:

> Stripe-ready billing architecture, but payment can be stubbed if time is limited.

Tables для billing уже есть:

- `billing_subscriptions`

Plans scaffold:

- `free`
- `pro`

## 15. Tests

Test runner:

- Vitest

Config:

- `vitest.config.ts`

Unit tests:

- `tests/unit/riskEngine.test.ts`
- `tests/unit/rescueCalculator.test.ts`
- `tests/unit/alertEngine.test.ts`
- `tests/unit/validation.test.ts`

Integration tests:

- `tests/integration/routes.test.ts`

Покрытие тестами:

- Health Factor raw conversion.
- Risk classification.
- No-debt handling.
- Liquidatable position handling.
- Repay-to-target formula.
- Collateral-to-target approximation.
- Alert cooldown.
- Zod validation rejects bad wallet/chain.
- `/api/health` returns ok.
- `/api/check` returns mocked Aave risk shape.
- `/api/watches` creates watch and stores snapshot.
- Cron rejects missing/invalid secret.
- Cron processes due watch using mocked adapter and mocked Telegram sender.
- Cron stores snapshot.
- Cron stores `sent` alert event.

Текущий результат:

```txt
npm test
5 test files passed
15 tests passed
```

## 16. Build and local verification

Commands run:

```bash
npm install
npm run db:generate
npm test
npm run build
```

Текущий статус:

- `npm test` passed.
- `npm run build` passed.
- `npm run db:generate` created migration.

HTTP smoke after dev server restart:

- `/` => 200
- `/wallets` => 200
- `/api/health` => 200

Current local dev server:

- `http://localhost:3000`

## 17. Review skill

Пользователь просил включать review skill при правках.

Использовался:

- `code-reviewer`

Что произошло:

- `review_report_generator.py` на весь проект сначала упал из-за Windows encoding `cp1252`.
- При попытке на всё дерево он был непрактичен из-за `node_modules`.
- Поэтому был запущен `code_quality_checker.py` отдельно по:
  - `app`
  - `lib`
  - `components`
  - затем повторно по изменённым зонам.

Найденная реальная проблема:

- `lib/alerts/engine.ts`: `shouldSendAlert` имел complexity 11.
- Функция была разбита на helpers:
  - `hasRiskWorsened`
  - `hasCooldownPassed`
- После этого review по `lib/alerts` дал grade A, no smells, no SOLID violations.

Позже integration tests нашли ещё более важную проблему:

- `POST /api/watches` пытался вернуть `snapshot` с `bigint`.
- `Response.json` падал: `Do not know how to serialize a BigInt`.
- Исправлено через `serializeSnapshot`.

Оставшиеся review notes:

- Низкоприоритетные false-positive/utility CSS warnings вида `text-slate-700` как magic numbers.
- Один low LSP/ISP warning из-за placeholder `morpho-blue: null` в adapter registry. Это сознательный V0 placeholder под будущий protocol adapter.

## 18. Известные warnings / проблемы окружения

### Next SWC warning

Во время build остаётся warning:

```txt
Attempted to load @next/swc-win32-x64-msvc...
next-swc.win32-x64-msvc.node is not a valid Win32 application
```

Сборка при этом проходит.

Вероятная причина:

- локальный Windows/native SWC binary mismatch.

Что можно сделать позже:

- переустановить dependencies cleanly;
- проверить Node architecture;
- удалить `node_modules` и lockfile, затем fresh install;
- либо обновить Next отдельно.

### Next outdated

Локально стоит Next `15.5.18`.

`npm view next version` показывал latest:

```txt
16.2.6
```

Обновление Next не выполнялось, потому что это отдельная миграционная задача.

### Viem/tempo warning

Build может показывать warning из `viem/chains` / `ox tempo`.

Сборка проходит. Warning связан с dependency trace внутри viem chain definitions.

### Ruflo MCP

Локальная инструкция `AGENTS.md` просила использовать Ruflo tools для complex/multi-file tasks.

Попытки использовать Ruflo:

- `hooks_route`
- `guidance_recommend`
- `browser_session_record`

Все падали с:

```txt
Transport closed
```

Поэтому Ruflo-функции фактически недоступны в этой сессии.

## 19. Что сделано не полностью

Ниже честный список того, что ещё не является production-complete.

### Auth

Сейчас нет полноценной user session/auth.

ТЗ допускало:

> For V0, auth can be simple magic-link placeholder or dev-mode user.

Текущая реализация ближе к dev-mode.

Что нужно для production:

- Better Auth / NextAuth / Clerk / Supabase Auth / custom magic link.
- Scope watches by authenticated user.
- Disable `GET /api/watches` returning all watches in production.

### Stripe

Checkout stub, не реальная Stripe integration.

Что нужно:

- Stripe customer creation.
- Checkout session.
- Webhook route.
- Subscription state sync.
- Plan limits enforced in watch creation.

### Aave address verification

Pool addresses добавлены явно, но не проверены live against official Aave address-book.

Что нужно:

- добавить `@bgd-labs/aave-address-book` или другой официальный source;
- сверить pool addresses;
- зафиксировать source/version в README.

### Rate limiting

Public endpoints сейчас без rate limiting.

Что нужно:

- Upstash Redis / middleware-based rate limit.
- Особенно для `/api/check` и `/api/watches`.

### Worker lock

Сейчас in-memory lock.

Для production нужно:

- Postgres advisory lock;
- или Redis lock;
- или worker environment с single-flight guarantee.

### Browser automation

Из-за Ruflo/browser tool failure не было полноценной browser automation проверки кликов и screenshots.

Проверка была через:

- HTTP smoke.
- Build.
- Tests.

## 20. Acceptance criteria status

1. `npm install` works — done.
2. `npm run dev` starts app — done.
3. `.env.example` complete — done.
4. `npm test` passes — done, 15 tests.
5. `/api/health` returns ok — done.
6. `/api/check` can check mocked Aave wallet — done in integration test.
7. User can create watch — done.
8. Cron route is protected — done and tested.
9. Cron stores snapshots — done and tested.
10. Telegram sending implemented and can be disabled/mocked — done.
11. Dashboard displays watch status — done.
12. No private key/custody flow — done.
13. README explains setup/env/db/cron/Telegram — done.

Partially production-ready:

- real live Aave check requires configured RPC env vars.
- production auth/rate limit/Stripe real checkout still pending.
- official Aave address verification pending.

## 21. Files most important for review

Review these first:

- `app/api/check/route.ts`
- `app/api/watches/route.ts`
- `app/api/cron/check-watches/route.ts`
- `lib/risk/engine.ts`
- `lib/risk/rescue.ts`
- `lib/risk/thresholds.ts`
- `lib/protocols/aave/client.ts`
- `lib/protocols/aave/risk.ts`
- `lib/protocols/aave/constants.ts`
- `lib/workers/checkWatches.ts`
- `lib/alerts/engine.ts`
- `lib/db/repository.ts`
- `lib/db/schema.ts`
- `tests/integration/routes.test.ts`

## 22. Suggested next steps

1. Add real auth and user scoping.
2. Add production rate limiting.
3. Replace explicit Aave addresses with official address-book source or verify and document exact source.
4. Add Postgres advisory lock for cron.
5. Add real Stripe checkout + webhook.
6. Add browser automation tests once browser tooling is available.
7. Add live RPC smoke script that runs only when RPC env vars are configured.
8. Consider clean reinstall or Next upgrade to remove SWC/native binary warning.

## 23. Bottom line

The project is now much closer to the original instruction than the first pass:

- It has a real Next.js app.
- It has typed domain logic.
- It has Aave adapter architecture.
- It has Drizzle schema and generated migration.
- It has Telegram alerting logic.
- It has cron worker behavior.
- It has wallet connect scaffold.
- It has meaningful mocked integration tests proving critical flows without live RPC.

It is still not a final production deployment, mainly because auth, rate limiting, official address verification, production worker lock, and real Stripe checkout are intentionally not fully completed yet.

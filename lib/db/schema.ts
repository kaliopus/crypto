import { bigint, boolean, integer, jsonb, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core/columns';
import { index } from 'drizzle-orm/pg-core/indexes';
import { pgTable } from 'drizzle-orm/pg-core/table';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
};

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  telegramChatId: text('telegram_chat_id'),
  ...timestamps
});

export const watches = pgTable(
  'watches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    walletAddress: text('wallet_address').notNull(),
    chainKey: text('chain_key').notNull(),
    protocolKey: text('protocol_key').notNull(),
    minHealthFactor: numeric('min_health_factor').notNull().default('1.25'),
    targetHealthFactor: numeric('target_health_factor').notNull().default('1.40'),
    telegramChatId: text('telegram_chat_id'),
    alertCooldownMinutes: integer('alert_cooldown_minutes').notNull().default(30),
    checkIntervalMinutes: integer('check_interval_minutes').notNull().default(15),
    isActive: boolean('is_active').notNull().default(true),
    nextCheckAt: timestamp('next_check_at', { withTimezone: true }).defaultNow().notNull(),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
    lastAlertedAt: timestamp('last_alerted_at', { withTimezone: true }),
    ...timestamps
  },
  (table) => ({
    userIdx: index('watches_user_id_idx').on(table.userId),
    activeNextCheckIdx: index('watches_active_next_check_idx').on(table.isActive, table.nextCheckAt),
    identityIdx: index('watches_identity_idx').on(table.walletAddress, table.chainKey, table.protocolKey)
  })
);

export const riskSnapshots = pgTable(
  'risk_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    watchId: uuid('watch_id').references(() => watches.id),
    walletAddress: text('wallet_address').notNull(),
    chainKey: text('chain_key').notNull(),
    protocolKey: text('protocol_key').notNull(),
    blockNumber: bigint('block_number', { mode: 'bigint' }),
    healthFactor: numeric('health_factor'),
    healthFactorRaw: text('health_factor_raw'),
    totalCollateralBase: text('total_collateral_base'),
    totalDebtBase: text('total_debt_base'),
    currentLiquidationThreshold: text('current_liquidation_threshold'),
    ltv: text('ltv'),
    availableBorrowsBase: text('available_borrows_base'),
    riskLevel: text('risk_level').notNull(),
    dangerReason: text('danger_reason'),
    repayToTargetBase: text('repay_to_target_base'),
    collateralToTargetBase: text('collateral_to_target_base'),
    rawJson: jsonb('raw_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    watchCreatedIdx: index('risk_snapshots_watch_created_idx').on(table.watchId, table.createdAt),
    chainProtocolCreatedIdx: index('risk_snapshots_chain_protocol_created_idx').on(table.chainKey, table.protocolKey, table.createdAt),
    riskCreatedIdx: index('risk_snapshots_risk_created_idx').on(table.riskLevel, table.createdAt)
  })
);

export const alertEvents = pgTable(
  'alert_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    watchId: uuid('watch_id').references(() => watches.id),
    snapshotId: uuid('snapshot_id').references(() => riskSnapshots.id),
    channel: text('channel').notNull(),
    status: text('status').notNull(),
    reason: text('reason'),
    payloadJson: jsonb('payload_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    watchIdx: index('alert_events_watch_id_idx').on(table.watchId),
    snapshotIdx: index('alert_events_snapshot_id_idx').on(table.snapshotId)
  })
);

export const billingSubscriptions = pgTable(
  'billing_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    provider: text('provider').notNull().default('stripe'),
    providerCustomerId: text('provider_customer_id'),
    providerSubscriptionId: text('provider_subscription_id'),
    status: text('status').notNull().default('free'),
    planKey: text('plan_key').notNull().default('free'),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    ...timestamps
  },
  (table) => ({
    userIdx: index('billing_subscriptions_user_id_idx').on(table.userId)
  })
);

export type Watch = typeof watches.$inferSelect;
export type NewWatch = typeof watches.$inferInsert;
export type RiskSnapshot = typeof riskSnapshots.$inferSelect;

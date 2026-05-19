import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getDb } from './index';
import { alertEvents, riskSnapshots, watches, type NewWatch, type RiskSnapshot, type Watch } from './schema';
import type { PositionRisk } from '@/lib/protocols/types';
import { serializePositionRisk } from '@/lib/risk/format';

export type WatchRecord = Omit<Watch, 'minHealthFactor' | 'targetHealthFactor'> & {
  minHealthFactor: string;
  targetHealthFactor: string;
};

export type AlertEventRecord = {
  id: string;
  watchId: string;
  snapshotId?: string | null;
  channel: string;
  status: 'sent' | 'suppressed' | 'failed';
  reason?: string | null;
  payloadJson: unknown;
  createdAt: Date;
};

const memory = {
  watches: [] as WatchRecord[],
  snapshots: [] as RiskSnapshot[],
  alerts: [] as AlertEventRecord[]
};

function now() {
  return new Date();
}

function normalizeWatch(input: NewWatch): WatchRecord {
  const date = now();
  return {
    id: randomUUID(),
    userId: input.userId ?? null,
    walletAddress: input.walletAddress,
    chainKey: input.chainKey,
    protocolKey: input.protocolKey,
    minHealthFactor: String(input.minHealthFactor ?? '1.25'),
    targetHealthFactor: String(input.targetHealthFactor ?? '1.40'),
    telegramChatId: input.telegramChatId ?? null,
    alertCooldownMinutes: input.alertCooldownMinutes ?? 30,
    isActive: input.isActive ?? true,
    lastCheckedAt: null,
    lastAlertedAt: null,
    createdAt: date,
    updatedAt: date
  };
}

export async function createWatch(input: NewWatch): Promise<WatchRecord> {
  const db = getDb();
  if (db) {
    const [row] = await (db as any).insert(watches).values(input).returning();
    return row as WatchRecord;
  }
  const row = normalizeWatch(input);
  memory.watches.push(row);
  return row;
}

export async function listWatches(userId: string): Promise<WatchRecord[]> {
  const db = getDb();
  if (db) {
    return (await (db as any)
      .select()
      .from(watches)
      .where(and(eq(watches.isActive, true), eq(watches.userId, userId)))) as WatchRecord[];
  }
  return memory.watches.filter((watch) => watch.isActive && watch.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updateWatch(
  id: string,
  input: Partial<Pick<WatchRecord, 'minHealthFactor' | 'targetHealthFactor' | 'telegramChatId' | 'isActive' | 'lastCheckedAt' | 'lastAlertedAt'>>,
  userId?: string
): Promise<WatchRecord | null> {
  const db = getDb();
  if (db) {
    const [row] = await (db as any)
      .update(watches)
      .set({ ...input, updatedAt: now() })
      .where(userId ? and(eq(watches.id, id), eq(watches.userId, userId)) : eq(watches.id, id))
      .returning();
    return (row as WatchRecord | undefined) ?? null;
  }
  const row = memory.watches.find((watch) => watch.id === id && (!userId || watch.userId === userId));
  if (!row) return null;
  Object.assign(row, input, { updatedAt: now() });
  return row;
}

export async function getWatch(id: string, userId?: string): Promise<WatchRecord | null> {
  const db = getDb();
  if (db) {
    const [row] = await (db as any)
      .select()
      .from(watches)
      .where(userId ? and(eq(watches.id, id), eq(watches.userId, userId)) : eq(watches.id, id))
      .limit(1);
    return (row as WatchRecord | undefined) ?? null;
  }
  return memory.watches.find((watch) => watch.id === id && (!userId || watch.userId === userId)) ?? null;
}

export async function listDueWatches(limit = 50): Promise<WatchRecord[]> {
  const db = getDb();
  if (db) {
    return (await (db as any).select().from(watches).where(eq(watches.isActive, true)).orderBy(watches.lastCheckedAt).limit(limit)) as WatchRecord[];
  }
  return memory.watches.filter((watch) => watch.isActive).slice(0, limit);
}

export async function storeRiskSnapshot(watchId: string | null, risk: PositionRisk): Promise<RiskSnapshot> {
  const serialized = serializePositionRisk(risk);
  const payload = {
    watchId,
    walletAddress: risk.walletAddress,
    chainKey: risk.chainKey,
    protocolKey: risk.protocolKey,
    blockNumber: risk.blockNumber,
    healthFactor: risk.healthFactor?.toString() ?? null,
    healthFactorRaw: risk.healthFactorRaw ?? null,
    totalCollateralBase: risk.totalCollateralBase?.toString() ?? null,
    totalDebtBase: risk.totalDebtBase?.toString() ?? null,
    currentLiquidationThreshold: risk.currentLiquidationThreshold?.toString() ?? null,
    ltv: risk.ltv?.toString() ?? null,
    availableBorrowsBase: risk.availableBorrowsBase?.toString() ?? null,
    riskLevel: risk.riskLevel,
    dangerReason: risk.dangerReason,
    repayToTargetBase: risk.rescuePlan?.repayToTargetBase?.toString() ?? null,
    collateralToTargetBase: risk.rescuePlan?.collateralToTargetBase?.toString() ?? null,
    rawJson: serialized
  };
  const db = getDb();
  if (db) {
    const [row] = await (db as any).insert(riskSnapshots).values(payload).returning();
    return row;
  }
  const row = {
    id: randomUUID(),
    ...payload,
    createdAt: now()
  } as RiskSnapshot;
  memory.snapshots.push(row);
  return row;
}

export async function listLatestSnapshots() {
  const db = getDb();
  if (db) {
    return (db as any).select().from(riskSnapshots).orderBy(desc(riskSnapshots.createdAt)).limit(100);
  }
  return [...memory.snapshots].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 100);
}

export async function getLastSnapshotForWatch(watchId: string) {
  const db = getDb();
  if (db) {
    const [row] = await (db as any)
      .select()
      .from(riskSnapshots)
      .where(eq(riskSnapshots.watchId, watchId))
      .orderBy(desc(riskSnapshots.createdAt))
      .limit(1);
    return row ?? null;
  }
  return memory.snapshots.filter((snapshot) => snapshot.watchId === watchId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
}

export async function storeAlertEvent(input: Omit<AlertEventRecord, 'id' | 'createdAt'>): Promise<AlertEventRecord> {
  const payload = {
    watchId: input.watchId,
    snapshotId: input.snapshotId ?? null,
    channel: input.channel,
    status: input.status,
    reason: input.reason ?? null,
    payloadJson: input.payloadJson
  };
  const db = getDb();
  if (db) {
    const [row] = await (db as any).insert(alertEvents).values(payload).returning();
    return row as AlertEventRecord;
  }
  const row = { id: randomUUID(), ...payload, createdAt: now() } as AlertEventRecord;
  memory.alerts.push(row);
  return row;
}

export async function listAlertEvents() {
  const db = getDb();
  if (db) {
    return (db as any).select().from(alertEvents).limit(100);
  }
  return [...memory.alerts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 100);
}

export function __resetMemoryRepository() {
  memory.watches = [];
  memory.snapshots = [];
  memory.alerts = [];
}

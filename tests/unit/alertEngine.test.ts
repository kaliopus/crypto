import { describe, expect, it } from 'vitest';
import { shouldSendAlert } from '@/lib/alerts/engine';
import type { WatchRecord } from '@/lib/db/repository';

const watch = {
  id: 'watch-1',
  userId: null,
  walletAddress: '0x0000000000000000000000000000000000000001',
  chainKey: 'base',
  protocolKey: 'aave-v3',
  minHealthFactor: '1.25',
  targetHealthFactor: '1.40',
  telegramChatId: '123',
  alertCooldownMinutes: 30,
  isActive: true,
  lastCheckedAt: null,
  lastAlertedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
} satisfies WatchRecord;

describe('alert engine', () => {
  it('sends when risk worsens', () => {
    expect(shouldSendAlert({ watch, currentRiskLevel: 'critical', previousRiskLevel: 'watch', healthFactor: 1.08 }).send).toBe(true);
  });

  it('suppresses during cooldown', () => {
    expect(
      shouldSendAlert({
        watch: { ...watch, lastAlertedAt: new Date('2026-01-01T00:00:00Z') },
        currentRiskLevel: 'warning',
        previousRiskLevel: 'warning',
        healthFactor: 1.2,
        now: new Date('2026-01-01T00:10:00Z')
      }).send
    ).toBe(false);
  });

  it('honors minHealthFactor even when the global risk band is safe', () => {
    expect(
      shouldSendAlert({
        watch: { ...watch, minHealthFactor: '1.80' },
        currentRiskLevel: 'safe',
        previousRiskLevel: 'safe',
        healthFactor: 1.6
      }).send
    ).toBe(true);
  });
});

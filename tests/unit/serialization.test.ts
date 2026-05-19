import { describe, expect, it } from 'vitest';
import { serializeJsonSafe } from '@/lib/json/serialize';
import { serializePositionRisk } from '@/lib/risk/format';
import type { PositionRisk } from '@/lib/protocols/types';

const riskWithNestedBigInt = {
  protocolKey: 'aave-v3',
  chainKey: 'base',
  walletAddress: '0x0000000000000000000000000000000000000001',
  blockNumber: 123n,
  healthFactor: 1.08,
  healthFactorRaw: '1080000000000000000',
  totalCollateralBase: 1500n,
  totalDebtBase: 1000n,
  availableBorrowsBase: 0n,
  currentLiquidationThreshold: 8000n,
  ltv: 7500n,
  riskLevel: 'critical',
  dangerReason: 'Health Factor is close to liquidation.',
  rescuePlan: {
    targetHealthFactor: 1.4,
    repayToTargetBase: 143n,
    collateralToTargetBase: 25n,
    explanation: 'Estimated action needed to restore Health Factor.',
    assumptions: ['unit test']
  },
  raw: {
    blockNumber: 123n,
    accountData: {
      totalCollateralBase: 1500n,
      totalDebtBase: 1000n,
      nested: [1n, { value: 2n }]
    },
    checkedAt: new Date('2026-05-19T00:00:00.000Z')
  }
} satisfies PositionRisk;

describe('JSON serialization', () => {
  it('deeply serializes BigInt and Date values', () => {
    const serialized = serializeJsonSafe(riskWithNestedBigInt.raw);

    expect(() => JSON.stringify(serialized)).not.toThrow();
    expect(serialized).toMatchObject({
      blockNumber: '123',
      accountData: {
        totalCollateralBase: '1500',
        totalDebtBase: '1000',
        nested: ['1', { value: '2' }]
      },
      checkedAt: '2026-05-19T00:00:00.000Z'
    });
  });

  it('serializes live-like Aave raw payload inside PositionRisk', () => {
    const serialized = serializePositionRisk(riskWithNestedBigInt);

    expect(() => JSON.stringify(serialized)).not.toThrow();
    expect(serialized.raw).toMatchObject({
      blockNumber: '123',
      accountData: {
        totalCollateralBase: '1500',
        totalDebtBase: '1000'
      }
    });
  });
});

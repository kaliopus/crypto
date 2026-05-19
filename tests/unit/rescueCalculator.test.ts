import { describe, expect, it } from 'vitest';
import { calculateRescuePlan } from '@/lib/risk/rescue';

describe('rescue calculator', () => {
  it('calculates repay to target', () => {
    const plan = calculateRescuePlan({
      totalCollateralBase: 1500n,
      totalDebtBase: 1000n,
      currentLiquidationThreshold: 8000n,
      targetHealthFactor: 1.5
    });
    expect(plan?.repayToTargetBase).toBe(200n);
  });

  it('calculates collateral addition approximation', () => {
    const plan = calculateRescuePlan({
      totalCollateralBase: 1000n,
      totalDebtBase: 1000n,
      currentLiquidationThreshold: 8000n,
      targetHealthFactor: 1.4
    });
    expect(plan?.collateralToTargetBase).toBe(750n);
  });
});

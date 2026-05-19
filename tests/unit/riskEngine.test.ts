import { describe, expect, it } from 'vitest';
import { classifyRisk } from '@/lib/risk/thresholds';
import { healthFactorFromRaw } from '@/lib/risk/rescue';

describe('risk classification', () => {
  it('converts raw WAD health factor', () => {
    expect(healthFactorFromRaw(1250000000000000000n)).toBe(1.25);
  });

  it('handles no-debt positions', () => {
    expect(classifyRisk({ totalDebtBase: 0n, healthFactor: Number.POSITIVE_INFINITY })).toBe('none');
  });

  it('handles liquidatable positions', () => {
    expect(classifyRisk({ totalDebtBase: 100n, healthFactor: 0.99 })).toBe('liquidatable');
  });

  it('classifies warning band', () => {
    expect(classifyRisk({ totalDebtBase: 100n, healthFactor: 1.2 })).toBe('warning');
  });
});

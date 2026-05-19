import type { RescuePlan } from '@/lib/protocols/types';

export const WAD = 10n ** 18n;

export function healthFactorFromRaw(raw: bigint) {
  const maxLike = (1n << 255n) - 1n;
  if (raw > maxLike) return Number.POSITIVE_INFINITY;
  return Number(raw) / 1e18;
}

export function calculateRescuePlan(input: {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  currentLiquidationThreshold: bigint;
  targetHealthFactor: number;
}): RescuePlan | null {
  if (input.totalDebtBase === 0n) return null;
  if (input.currentLiquidationThreshold === 0n) {
    return {
      targetHealthFactor: input.targetHealthFactor,
      repayToTargetBase: input.totalDebtBase,
      collateralToTargetBase: null,
      explanation: 'Repayment is required because collateral liquidation threshold is zero.',
      assumptions: ['Base-currency values come from Aave account data.', 'No asset-specific price conversion is applied.']
    };
  }

  const targetWad = BigInt(Math.round(input.targetHealthFactor * 1e18));
  const collateralAdjusted = (input.totalCollateralBase * input.currentLiquidationThreshold) / 10_000n;
  const requiredDebtAfter = (collateralAdjusted * WAD) / targetWad;
  const repayToTargetBase = input.totalDebtBase > requiredDebtAfter ? input.totalDebtBase - requiredDebtAfter : 0n;

  const requiredCollateralAdjusted = (input.totalDebtBase * targetWad) / WAD;
  const additionalAdjustedCollateral = requiredCollateralAdjusted > collateralAdjusted ? requiredCollateralAdjusted - collateralAdjusted : 0n;
  // Approximation: assumes new collateral has the same weighted LT as the current portfolio.
  const collateralToTargetBase = (additionalAdjustedCollateral * 10_000n) / input.currentLiquidationThreshold;

  return {
    targetHealthFactor: input.targetHealthFactor,
    repayToTargetBase,
    collateralToTargetBase,
    explanation: `Estimated action needed to restore Health Factor to ${input.targetHealthFactor.toFixed(2)}.`,
    assumptions: [
      'Repay amount is expressed in Aave base-currency debt value.',
      'Collateral addition assumes the same effective liquidation threshold as the current collateral mix.',
      'Actual wallet transaction amounts depend on selected assets, prices, and protocol parameters.'
    ]
  };
}

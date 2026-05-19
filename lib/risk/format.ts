import type { PositionRisk } from '@/lib/protocols/types';
import { serializeJsonSafe } from '@/lib/json/serialize';

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBaseUnits(value?: bigint | null) {
  if (value === undefined || value === null) return 'n/a';
  return value.toString();
}

export function serializePositionRisk(risk: PositionRisk) {
  return {
    ...risk,
    blockNumber: risk.blockNumber?.toString(),
    healthFactorRaw: risk.healthFactorRaw,
    totalCollateralBase: risk.totalCollateralBase?.toString(),
    totalDebtBase: risk.totalDebtBase?.toString(),
    availableBorrowsBase: risk.availableBorrowsBase?.toString(),
    currentLiquidationThreshold: risk.currentLiquidationThreshold?.toString(),
    ltv: risk.ltv?.toString(),
    rescuePlan: risk.rescuePlan
      ? {
          ...risk.rescuePlan,
          repayToTargetBase: risk.rescuePlan.repayToTargetBase?.toString() ?? null,
          collateralToTargetBase: risk.rescuePlan.collateralToTargetBase?.toString() ?? null
        }
      : null,
    raw: serializeJsonSafe(risk.raw)
  };
}

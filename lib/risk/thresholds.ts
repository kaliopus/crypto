import type { RiskLevel } from '@/lib/protocols/types';

export const DEFAULT_THRESHOLDS = {
  watch: 1.5,
  warning: 1.25,
  critical: 1.1,
  liquidatable: 1.0
};

export function classifyRisk(input: { totalDebtBase: bigint; healthFactor: number | null; error?: boolean }): RiskLevel {
  if (input.error || input.healthFactor === null || Number.isNaN(input.healthFactor)) return 'unknown';
  if (input.totalDebtBase === 0n) return 'none';
  if (input.healthFactor >= DEFAULT_THRESHOLDS.watch) return 'safe';
  if (input.healthFactor >= DEFAULT_THRESHOLDS.warning) return 'watch';
  if (input.healthFactor >= DEFAULT_THRESHOLDS.critical) return 'warning';
  if (input.healthFactor >= DEFAULT_THRESHOLDS.liquidatable) return 'critical';
  return 'liquidatable';
}

export function riskReason(riskLevel: RiskLevel, minHealthFactor?: number) {
  if (riskLevel === 'none') return 'No active debt was detected.';
  if (riskLevel === 'safe') return minHealthFactor ? `Health Factor is above the configured threshold ${minHealthFactor}.` : 'Health Factor is in the safe range.';
  if (riskLevel === 'watch') return 'Health Factor is below the watch threshold.';
  if (riskLevel === 'warning') return 'Health Factor is below the warning threshold.';
  if (riskLevel === 'critical') return 'Health Factor is close to liquidation.';
  if (riskLevel === 'liquidatable') return 'Health Factor is below 1.0 and the position may be liquidatable.';
  return 'Risk is unknown because the check failed or returned incomplete data.';
}

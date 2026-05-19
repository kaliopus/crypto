import { getChainConfig, type ChainKey } from '@/lib/chains';
import type { PositionRisk } from '@/lib/protocols/types';
import { env } from '@/lib/config';
import { formatBaseUnits, shortAddress } from '@/lib/risk/format';

export function buildTelegramAlert(input: {
  risk: PositionRisk;
  minHealthFactor: number;
  targetHealthFactor: number;
}) {
  const chainName = getChainConfig(input.risk.chainKey as ChainKey).name;
  const rescue = input.risk.rescuePlan;
  const dashboardUrl = `${env.appBaseUrl}/dashboard`;

  return [
    'Risk Sentinel Alert',
    '',
    `Wallet: ${shortAddress(input.risk.walletAddress)}`,
    `Chain: ${chainName}`,
    'Protocol: Aave V3',
    `Risk: ${input.risk.riskLevel.toUpperCase()}`,
    `Health Factor: ${input.risk.healthFactor === null ? 'unknown' : input.risk.healthFactor.toFixed(3)}`,
    `Your threshold: ${input.minHealthFactor.toFixed(2)}`,
    `Target HF: ${input.targetHealthFactor.toFixed(2)}`,
    '',
    'Estimated rescue:',
    `- Repay: ~${formatBaseUnits(rescue?.repayToTargetBase)} base units of debt value`,
    `- Or add collateral: ~${formatBaseUnits(rescue?.collateralToTargetBase)} base units of collateral value`,
    '',
    `Reason: ${input.risk.dangerReason}`,
    '',
    `Open dashboard: ${dashboardUrl}`
  ].join('\n');
}

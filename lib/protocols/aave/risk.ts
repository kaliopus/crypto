import type { ChainKey } from '@/lib/chains';
import type { PositionRisk, ProtocolAdapter } from '@/lib/protocols/types';
import { calculateRescuePlan, healthFactorFromRaw } from '@/lib/risk/rescue';
import { classifyRisk, riskReason } from '@/lib/risk/thresholds';
import { getAaveUserAccountData } from './client';

export const aaveV3Adapter: ProtocolAdapter = {
  protocolKey: 'aave-v3',
  async getPositionRisk(input) {
    try {
      const data = await getAaveUserAccountData({
        chainKey: input.chainKey as ChainKey,
        walletAddress: input.walletAddress
      });
      const healthFactor = healthFactorFromRaw(data.healthFactor);
      const riskLevel = classifyRisk({ totalDebtBase: data.totalDebtBase, healthFactor });
      const rescuePlan = calculateRescuePlan({
        totalCollateralBase: data.totalCollateralBase,
        totalDebtBase: data.totalDebtBase,
        currentLiquidationThreshold: data.currentLiquidationThreshold,
        targetHealthFactor: input.targetHealthFactor
      });

      return {
        protocolKey: 'aave-v3',
        chainKey: input.chainKey,
        walletAddress: input.walletAddress,
        blockNumber: data.blockNumber,
        healthFactor,
        healthFactorRaw: data.healthFactor.toString(),
        totalCollateralBase: data.totalCollateralBase,
        totalDebtBase: data.totalDebtBase,
        availableBorrowsBase: data.availableBorrowsBase,
        currentLiquidationThreshold: data.currentLiquidationThreshold,
        ltv: data.ltv,
        riskLevel,
        dangerReason: riskReason(riskLevel),
        rescuePlan,
        raw: data
      } satisfies PositionRisk;
    } catch (error) {
      return {
        protocolKey: 'aave-v3',
        chainKey: input.chainKey,
        walletAddress: input.walletAddress,
        healthFactor: null,
        riskLevel: 'unknown',
        dangerReason: 'Aave RPC check failed. Store this snapshot and retry later.',
        rescuePlan: null,
        raw: {
          error: error instanceof Error ? error.message : 'Unknown Aave adapter error'
        }
      } satisfies PositionRisk;
    }
  }
};

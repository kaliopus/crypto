import type { ChainKey } from '@/lib/chains';
import {
  AaveV3Arbitrum,
  AaveV3Base,
  AaveV3Ethereum,
  AaveV3Optimism
} from '@aave-dao/aave-address-book';

export const AAVE_V3_POOL_ADDRESSES: Record<ChainKey, `0x${string}`> = {
  ethereum: AaveV3Ethereum.POOL,
  base: AaveV3Base.POOL,
  arbitrum: AaveV3Arbitrum.POOL,
  optimism: AaveV3Optimism.POOL
};

export const AAVE_POOL_ABI = [
  {
    type: 'function',
    name: 'getUserAccountData',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' }
    ]
  }
] as const;

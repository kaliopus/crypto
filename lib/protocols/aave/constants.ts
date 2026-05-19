import type { ChainKey } from '@/lib/chains';

// V0 uses explicit Aave V3 Pool addresses. Verify against official Aave docs
// and/or the Aave address-book package before production deployment.
export const AAVE_V3_POOL_ADDRESSES: Record<ChainKey, `0x${string}`> = {
  ethereum: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  base: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
  arbitrum: '0x794a61358D6845594F94dc1Db02A252b5b4814aD',
  optimism: '0x794a61358D6845594F94dc1Db02A252b5b4814aD'
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

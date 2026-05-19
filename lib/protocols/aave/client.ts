import type { ChainKey } from '@/lib/chains';
import { createChainPublicClient } from '@/lib/rpc/client';
import { AAVE_POOL_ABI, AAVE_V3_POOL_ADDRESSES } from './constants';

export async function getAaveUserAccountData(input: {
  chainKey: ChainKey;
  walletAddress: `0x${string}`;
}): Promise<{
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
  blockNumber: bigint;
}> {
  const client = await createChainPublicClient(input.chainKey);
  const [accountData, blockNumber] = await Promise.all([
    client.readContract({
      address: AAVE_V3_POOL_ADDRESSES[input.chainKey],
      abi: AAVE_POOL_ABI,
      functionName: 'getUserAccountData',
      args: [input.walletAddress]
    }),
    client.getBlockNumber()
  ]);

  const [
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThreshold,
    ltv,
    healthFactor
  ] = accountData;

  return {
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThreshold,
    ltv,
    healthFactor,
    blockNumber
  };
}

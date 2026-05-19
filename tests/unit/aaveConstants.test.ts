import { describe, expect, it } from 'vitest';
import {
  AaveV3Arbitrum,
  AaveV3Base,
  AaveV3Ethereum,
  AaveV3Optimism
} from '@aave-dao/aave-address-book';
import { AAVE_V3_POOL_ADDRESSES } from '@/lib/protocols/aave/constants';

describe('Aave constants', () => {
  it('uses the official Aave address-book pool addresses', () => {
    expect(AAVE_V3_POOL_ADDRESSES.ethereum).toBe(AaveV3Ethereum.POOL);
    expect(AAVE_V3_POOL_ADDRESSES.base).toBe(AaveV3Base.POOL);
    expect(AAVE_V3_POOL_ADDRESSES.arbitrum).toBe(AaveV3Arbitrum.POOL);
    expect(AAVE_V3_POOL_ADDRESSES.optimism).toBe(AaveV3Optimism.POOL);
  });
});

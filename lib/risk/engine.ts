import type { PositionRisk, ProtocolAdapter, ProtocolKey } from '@/lib/protocols/types';
import { aaveV3Adapter } from '@/lib/protocols/aave/risk';

const adapters: Record<ProtocolKey, ProtocolAdapter | null> = {
  'aave-v3': aaveV3Adapter,
  'morpho-blue': null
};

const testAdapters = new Map<ProtocolKey, ProtocolAdapter>();

export function getProtocolAdapter(protocolKey: ProtocolKey) {
  const testAdapter = testAdapters.get(protocolKey);
  if (testAdapter) return testAdapter;
  const adapter = adapters[protocolKey];
  if (!adapter) {
    throw new Error(`${protocolKey} is not implemented in V0.`);
  }
  return adapter;
}

export async function checkPositionRisk(input: {
  protocolKey: ProtocolKey;
  chainKey: string;
  walletAddress: `0x${string}`;
  targetHealthFactor: number;
  adapter?: ProtocolAdapter;
}): Promise<PositionRisk> {
  const adapter = input.adapter ?? getProtocolAdapter(input.protocolKey);
  return adapter.getPositionRisk({
    walletAddress: input.walletAddress,
    chainKey: input.chainKey,
    targetHealthFactor: input.targetHealthFactor
  });
}

export function __setProtocolAdapterForTests(protocolKey: ProtocolKey, adapter: ProtocolAdapter | null) {
  if (adapter) {
    testAdapters.set(protocolKey, adapter);
    return;
  }
  testAdapters.delete(protocolKey);
}

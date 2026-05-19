import { createPublicClient, http } from 'viem';
import { getChainConfig, getRpcUrl, type ChainKey } from '@/lib/chains';

async function getViemChain(chainKey: ChainKey) {
  const { arbitrum, base, mainnet, optimism } = await import('viem/chains');
  return {
    ethereum: mainnet,
    base,
    arbitrum,
    optimism
  }[chainKey];
}

export async function createChainPublicClient(chainKey: ChainKey) {
  const rpcUrl = getRpcUrl(chainKey);
  if (!rpcUrl) {
    throw new Error(`${getChainConfig(chainKey).rpcEnvVar} is not configured.`);
  }

  return createPublicClient({
    chain: await getViemChain(chainKey),
    transport: http(rpcUrl, { timeout: 10_000, retryCount: 2, retryDelay: 500 })
  });
}

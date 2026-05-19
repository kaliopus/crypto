export type ChainKey = 'ethereum' | 'base' | 'arbitrum' | 'optimism';

export type ChainConfig = {
  key: ChainKey;
  chainId: number;
  name: string;
  rpcEnvVar: string;
  nativeSymbol: string;
  explorerBaseUrl: string;
};

export const CHAINS: Record<ChainKey, ChainConfig> = {
  ethereum: {
    key: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    rpcEnvVar: 'ETHEREUM_RPC_URL',
    nativeSymbol: 'ETH',
    explorerBaseUrl: 'https://etherscan.io'
  },
  base: {
    key: 'base',
    chainId: 8453,
    name: 'Base',
    rpcEnvVar: 'BASE_RPC_URL',
    nativeSymbol: 'ETH',
    explorerBaseUrl: 'https://basescan.org'
  },
  arbitrum: {
    key: 'arbitrum',
    chainId: 42161,
    name: 'Arbitrum',
    rpcEnvVar: 'ARBITRUM_RPC_URL',
    nativeSymbol: 'ETH',
    explorerBaseUrl: 'https://arbiscan.io'
  },
  optimism: {
    key: 'optimism',
    chainId: 10,
    name: 'Optimism',
    rpcEnvVar: 'OPTIMISM_RPC_URL',
    nativeSymbol: 'ETH',
    explorerBaseUrl: 'https://optimistic.etherscan.io'
  }
};

export function getChainConfig(chainKey: ChainKey) {
  return CHAINS[chainKey];
}

export function getRpcUrl(chainKey: ChainKey) {
  const config = getChainConfig(chainKey);
  return process.env[config.rpcEnvVar];
}

'use client';

import { createConfig, http, injected } from 'wagmi';
import { arbitrum, base, mainnet, optimism } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, optimism],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http()
  },
  ssr: true
});

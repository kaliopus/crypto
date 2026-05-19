import { getChainConfig, type ChainKey } from '@/lib/chains';

export function ChainBadge({ chainKey }: { chainKey: string }) {
  const chain = getChainConfig(chainKey as ChainKey);
  return <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{chain.name}</span>;
}

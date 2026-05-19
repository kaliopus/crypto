import { ChainBadge } from './ChainBadge';

type WatchRow = {
  id?: string;
  walletAddress?: string;
  chainKey?: string;
  protocolKey?: string;
  minHealthFactor?: string;
  targetHealthFactor?: string;
  lastCheckedAt?: string | Date | null;
  telegramChatId?: string | null;
};

export function PositionTable({ watches }: { watches: WatchRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Wallet</th>
            <th className="px-4 py-3">Chain</th>
            <th className="px-4 py-3">Protocol</th>
            <th className="px-4 py-3">Threshold</th>
            <th className="px-4 py-3">Target HF</th>
            <th className="px-4 py-3">Telegram</th>
            <th className="px-4 py-3">Last checked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {watches.map((watch, index) => (
            <tr key={watch.id ?? index}>
              <td className="max-w-[15rem] truncate px-4 py-3 font-mono">{watch.walletAddress ?? 'n/a'}</td>
              <td className="px-4 py-3">{watch.chainKey ? <ChainBadge chainKey={watch.chainKey} /> : 'n/a'}</td>
              <td className="px-4 py-3">{watch.protocolKey ?? 'n/a'}</td>
              <td className="px-4 py-3">{watch.minHealthFactor ?? 'n/a'}</td>
              <td className="px-4 py-3">{watch.targetHealthFactor ?? 'n/a'}</td>
              <td className="px-4 py-3">{watch.telegramChatId ? 'Configured' : 'Disabled'}</td>
              <td className="px-4 py-3">{watch.lastCheckedAt ? new Date(watch.lastCheckedAt).toLocaleString() : 'Not checked'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnectPanel() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-ink">Wallet connect</h2>
      <p className="mt-2 text-sm text-slate-600">Connect an injected EVM wallet for address handling. Risk checks still require explicit confirmation and never request private keys.</p>
      {isConnected ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">{address}</span>
          <button type="button" onClick={() => disconnect()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-ink">
            Disconnect
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!connector || isPending}
          onClick={() => connector && connect({ connector })}
          className="mt-4 rounded-md bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {isPending ? 'Connecting...' : 'Connect wallet'}
        </button>
      )}
    </section>
  );
}

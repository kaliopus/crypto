'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RiskCard } from '@/components/RiskCard';
import { WalletConnectPanel } from '@/components/WalletConnectPanel';

type CheckResult = {
  healthFactor: number | null;
  riskLevel: string;
  dangerReason: string;
  totalCollateralBase?: string;
  totalDebtBase?: string;
  currentLiquidationThreshold?: string;
  rescuePlan?: {
    repayToTargetBase?: string | null;
    collateralToTargetBase?: string | null;
    explanation: string;
    assumptions: string[];
  } | null;
};

export default function WalletsPage() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function check(formData: FormData) {
    setPending(true);
    setError(null);
    setResult(null);
    const params = new URLSearchParams({
      wallet: String(formData.get('wallet')),
      chain: String(formData.get('chain')),
      protocol: 'aave-v3',
      targetHealthFactor: String(formData.get('targetHealthFactor'))
    });
    const response = await fetch(`/api/check?${params.toString()}`);
    const json = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(JSON.stringify(json.error));
      return;
    }
    setResult(json.data);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-6">
      <header className="flex items-center justify-between py-3">
        <Link href="/" className="text-lg font-black text-ink">Risk Sentinel</Link>
        <Link href="/dashboard" className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">Dashboard</Link>
      </header>
      <section className="py-8">
        <h1 className="text-4xl font-black text-ink">Check wallet risk</h1>
        <p className="mt-3 text-slate-600">Run a one-off Aave V3 risk check without creating a watch.</p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <form action={check} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Wallet address
            <input name="wallet" required placeholder="0x..." className="rounded-md border border-slate-300 px-3 py-2 font-mono text-sm" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Chain
              <select name="chain" defaultValue="base" className="rounded-md border border-slate-300 px-3 py-2">
                <option value="ethereum">Ethereum</option>
                <option value="base">Base</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="optimism">Optimism</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Target Health Factor
              <input name="targetHealthFactor" type="number" step="0.01" defaultValue="1.40" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <button disabled={pending} className="rounded-md bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {pending ? 'Checking...' : 'Check wallet'}
          </button>
        </form>
        <div className="space-y-4">
          <WalletConnectPanel />
        </div>
      </div>
      {error ? <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {result ? <div className="mt-6"><RiskCard risk={result} /></div> : null}
    </main>
  );
}

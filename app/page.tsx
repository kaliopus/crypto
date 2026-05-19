import Link from 'next/link';
import { WatchForm } from '@/components/WatchForm';
import { RescuePlanCard } from '@/components/RescuePlanCard';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6">
      <header className="flex items-center justify-between py-3">
        <Link href="/" className="text-lg font-black text-ink">Risk Sentinel</Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-slate-700">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/wallets">Wallets</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
      </header>

      <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <h1 className="max-w-3xl text-5xl font-black leading-tight text-ink sm:text-6xl">
            Telegram alerts before your Aave position gets liquidated.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Monitor Aave V3 borrow risk across Ethereum, Base, Arbitrum, and Optimism. See current Health Factor, danger reason, and the estimated repay or collateral action needed to restore your target Health Factor.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/wallets" className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white">Check wallet</Link>
            <Link href="/dashboard" className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-ink">Create watch</Link>
          </div>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-3">
            <p>No custody.</p>
            <p>No private keys.</p>
            <p>No auto-trading.</p>
          </div>
        </div>
        <div className="space-y-4">
          <WatchForm />
          <RescuePlanCard />
        </div>
      </section>

      <section className="grid gap-4 pb-12 md:grid-cols-3">
        {[
          ['Aave V3 first', 'Typed adapter interface keeps Morpho, Spark, Euler, and Fluid support additive.'],
          ['Raw snapshots', 'Every check stores normalized fields and raw payload metadata for later analytics.'],
          ['Protected worker', 'Cron checks watches behind CRON_SECRET and suppresses alert spam with cooldown logic.']
        ].map(([title, body]) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

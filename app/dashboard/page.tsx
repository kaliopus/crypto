import Link from 'next/link';
import { AlertHistory } from '@/components/AlertHistory';
import { PositionTable } from '@/components/PositionTable';
import { WatchForm } from '@/components/WatchForm';
import { listWatches } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const watches = await listWatches();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-6">
      <header className="flex items-center justify-between py-3">
        <Link href="/" className="text-lg font-black text-ink">Risk Sentinel</Link>
        <Link href="/wallets" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-ink">Check wallet</Link>
      </header>
      <section className="py-8">
        <h1 className="text-4xl font-black text-ink">Dashboard</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Active watches, configured thresholds, last check status, and Telegram readiness.
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <PositionTable watches={watches.map((watch) => ({ ...watch, lastCheckedAt: watch.lastCheckedAt?.toISOString() ?? null }))} />
          <AlertHistory />
        </div>
        <WatchForm />
      </div>
    </main>
  );
}

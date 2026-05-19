import Link from 'next/link';
import { PLANS } from '@/lib/billing/stripe';

export default function PricingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-6">
      <header className="flex items-center justify-between py-3">
        <Link href="/" className="text-lg font-black text-ink">Risk Sentinel</Link>
        <Link href="/dashboard" className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">Create watch</Link>
      </header>
      <section className="py-10">
        <h1 className="text-4xl font-black text-ink">Billing scaffold</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Stripe-ready architecture is present. Checkout is stubbed until production keys and pricing IDs are configured.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.values(PLANS).map((plan) => (
          <article key={plan.key} className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-ink">{plan.name}</h2>
            <p className="mt-2 text-slate-600">{plan.watchLimit} active watches</p>
            <form action="/api/billing/checkout" method="post">
              <button className="mt-5 rounded-md bg-ink px-4 py-2.5 text-sm font-bold text-white">Start billing setup</button>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}

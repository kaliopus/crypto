'use client';

import { useState } from 'react';

type SubmitState = { ok: boolean; message: string };

export function WatchForm() {
  const [state, setState] = useState<SubmitState | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setState(null);
    const payload = {
      walletAddress: formData.get('walletAddress'),
      chainKey: formData.get('chainKey'),
      protocolKey: 'aave-v3',
      minHealthFactor: Number(formData.get('minHealthFactor')),
      targetHealthFactor: Number(formData.get('targetHealthFactor')),
      telegramChatId: formData.get('telegramChatId') || undefined
    };
    const response = await fetch('/api/watches', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    setPending(false);
    setState({ ok: response.ok, message: response.ok ? 'Watch created and checked.' : JSON.stringify(json.error) });
  }

  return (
    <form action={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Wallet address
        <input name="walletAddress" required placeholder="0x..." className="rounded-md border border-slate-300 px-3 py-2 font-mono text-sm" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Chain
          <select name="chainKey" defaultValue="base" className="rounded-md border border-slate-300 px-3 py-2">
            <option value="ethereum">Ethereum</option>
            <option value="base">Base</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Telegram chat ID
          <input name="telegramChatId" placeholder="123456789" className="rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Min Health Factor
          <input name="minHealthFactor" type="number" step="0.01" defaultValue="1.25" className="rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Target Health Factor
          <input name="targetHealthFactor" type="number" step="0.01" defaultValue="1.40" className="rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <button disabled={pending} className="rounded-md bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
        {pending ? 'Creating...' : 'Create watch'}
      </button>
      {state ? <p className={state.ok ? 'text-sm text-emerald-700' : 'text-sm text-red-700'}>{state.message}</p> : null}
    </form>
  );
}

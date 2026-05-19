export function AlertHistory() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-ink">Alert history</h2>
      <p className="mt-2 text-sm text-slate-600">Alert events are stored by the worker after every check as sent, suppressed, or failed.</p>
    </section>
  );
}

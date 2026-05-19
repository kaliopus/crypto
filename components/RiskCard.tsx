import { formatBaseUnits } from '@/lib/risk/format';

type RiskData = {
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

export function RiskCard({ risk }: { risk: RiskData }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Health Factor</p>
          <h2 className="mt-1 text-4xl font-bold text-ink">{risk.healthFactor === null ? 'Unknown' : risk.healthFactor.toFixed(3)}</h2>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold uppercase text-white">{risk.riskLevel}</span>
      </div>
      <p className="mt-4 text-sm text-slate-600">{risk.dangerReason}</p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Collateral base" value={risk.totalCollateralBase ?? 'n/a'} />
        <Metric label="Debt base" value={risk.totalDebtBase ?? 'n/a'} />
        <Metric label="Liquidation threshold" value={risk.currentLiquidationThreshold ?? 'n/a'} />
      </dl>
      {risk.rescuePlan ? (
        <div className="mt-5 rounded-lg bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-950">{risk.rescuePlan.explanation}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Metric label="Repay estimate" value={formatBaseUnits(BigInt(risk.rescuePlan.repayToTargetBase ?? '0'))} />
            <Metric label="Collateral estimate" value={formatBaseUnits(BigInt(risk.rescuePlan.collateralToTargetBase ?? '0'))} />
          </div>
          <ul className="mt-3 space-y-1 text-xs text-emerald-900">
            {risk.rescuePlan.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-all text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

import { TrendingUp, ArrowRight } from "lucide-react";
import type { MarketContext, Gap } from "@/types";

interface MarketDashboardProps {
  marketContext: MarketContext;
  gaps: Gap[];
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? "bg-emerald-400" : pct >= 45 ? "bg-amber-400" : "bg-brand";

  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800">
      <div
        className={`h-1.5 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">{label}</p>
      <p className="text-base font-bold text-zinc-200 leading-none">{value}</p>
      {sub && <p className="mt-1 text-[10px] text-zinc-600">{sub}</p>}
    </div>
  );
}

export function MarketDashboard({ marketContext, gaps }: MarketDashboardProps) {
  const { theme, marketCondition, opportunityScore, marketSize, growthRate, signals, mainPatterns, competitorsFound } = marketContext;
  const topGap = gaps?.[0];

  return (
    <div className="space-y-4">

      {/* Overview header */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-3.5 w-3.5 text-brand/70" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Market Overview</span>
          <span className="ml-auto text-[10px] text-zinc-600">{competitorsFound} sources</span>
        </div>

        <p className="text-sm font-bold text-zinc-200 mb-0.5">{theme}</p>
        <p className="text-xs text-zinc-500 mb-4">{marketCondition}</p>

        {/* Opportunity score */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Opportunity Score</span>
            <span className="text-xs font-bold text-zinc-300">{opportunityScore}/100</span>
          </div>
          <ScoreBar value={opportunityScore} />
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <StatBox label="Market Size" value={marketSize} />
          <StatBox label="Growth Rate" value={growthRate} />
          <StatBox label="Competition" value={marketCondition.split(" ")[0]} sub={`${competitorsFound} found`} />
        </div>
      </div>

      {/* Market Signals */}
      {signals?.length > 0 && (
        <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Market Signals</p>
          <ul className="space-y-2.5">
            {signals.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-400 leading-relaxed">
                <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 text-brand/60" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Patterns */}
      {mainPatterns?.length > 0 && (
        <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Key Patterns</p>
          <ul className="space-y-2">
            {mainPatterns.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-500 leading-relaxed">
                <span className="mt-[5px] h-[4px] w-[4px] shrink-0 rounded-full bg-zinc-700" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Gap */}
      {topGap && (
        <div className="rounded-xl border border-brand/15 bg-brand/[0.03] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand/60 mb-2">Top Opportunity Gap</p>
          <p className="text-sm font-semibold text-zinc-300 mb-3">{topGap.title}</p>
          <dl className="space-y-1.5">
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-[9px] font-bold uppercase tracking-widest text-zinc-600 pt-[1px]">Currently</dt>
              <dd className="text-xs text-zinc-500 leading-snug">{topGap.currentMarket}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-[9px] font-bold uppercase tracking-widest text-zinc-600 pt-[1px]">Missing</dt>
              <dd className="text-xs text-zinc-500 leading-snug">{topGap.missing}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

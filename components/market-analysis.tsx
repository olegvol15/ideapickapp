import { TrendingUp } from "lucide-react";
import type { MarketContext } from "@/types";

export function MarketAnalysis({ marketContext }: { marketContext: MarketContext }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-3.5 w-3.5 text-brand/70" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Market Analysis
        </span>
        <span className="ml-auto rounded-sm border border-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {marketContext.competitorsFound} sources
        </span>
      </div>

      {/* Theme + condition */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
        <p className="text-sm font-bold text-zinc-200">{marketContext.theme}</p>
        <span className="text-[11px] text-zinc-500">{marketContext.marketCondition}</span>
      </div>

      {/* Patterns */}
      <ul className="space-y-2">
        {marketContext.mainPatterns.map((p, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-500 leading-relaxed">
            <span className="mt-1.5 h-[5px] w-[5px] shrink-0 rounded-full bg-zinc-700" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

import { BarChart2 } from "lucide-react";
import type { MarketContext, Gap } from "@/types";

interface MarketInsightsProps {
  marketContext: MarketContext;
  gaps: Gap[];
}

export function MarketInsights({ marketContext, gaps }: MarketInsightsProps) {
  const topGap = gaps?.[0];
  const topPattern = marketContext.mainPatterns?.[0];

  const rows: { label: string; value: string }[] = [
    { label: "Market",    value: marketContext.theme },
    { label: "Condition", value: marketContext.marketCondition },
    ...(topPattern ? [{ label: "Signal",    value: topPattern }] : []),
    ...(topGap     ? [{ label: "Top gap",   value: topGap.title }] : []),
  ].slice(0, 4);

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="h-3.5 w-3.5 text-zinc-600" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Market Insights
        </span>
        <span className="ml-auto text-[10px] text-zinc-600">
          {marketContext.competitorsFound} sources
        </span>
      </div>

      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-3">
            <dt className="w-20 shrink-0 text-[9px] font-bold uppercase tracking-widest text-zinc-600 pt-[1px]">
              {row.label}
            </dt>
            <dd className="text-xs text-zinc-400 leading-snug">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

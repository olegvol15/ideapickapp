'use client';

import { ExternalLink } from 'lucide-react';
import { CompetitorLogo } from '@/components/market/competitors-list/CompetitorLogo';
import { SectionHeading } from './SectionHeading';
import { findInsight } from '@/lib/validate/competitors';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

interface ValidationCompetitorsBlockProps {
  result: EnhancedValidationResult;
  competitors: Competitor[];
}

function fmtRevenue(rev: { low: number; high: number }): string {
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
  return `~${fmt(rev.low)}–${fmt(rev.high)}/mo est.`;
}

export function ValidationCompetitorsBlock({
  result,
  competitors,
}: ValidationCompetitorsBlockProps) {
  const { competitorInsights, marketHardness } = result;
  const competitorItems = competitors
    .filter((c) => c.type !== 'signal')
    .slice(0, 4);

  if (
    competitorItems.length === 0 &&
    (!competitorInsights || competitorInsights.length === 0)
  )
    return null;

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-5 flex flex-col gap-4">
      <SectionHeading>Why users pick competitors over your idea</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {competitorItems.map((c) => {
          const ins = findInsight(c, competitorInsights ?? []);
          const hasRevenue =
            c.revenueEstimate &&
            (c.revenueEstimate.low > 0 || c.revenueEstimate.high > 0);
          return (
            <div
              key={c.url}
              className="rounded-lg border border-border bg-muted/10 p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CompetitorLogo domain={c.source} name={c.name} />
                  <span className="text-sm font-semibold text-foreground/90 truncate">
                    {c.name}
                  </span>
                </div>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {(c.rating != null || hasRevenue) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {c.rating != null && (
                    <span className="text-[11px] font-medium text-amber-400/80">
                      ★ {c.rating.toFixed(1)}
                      {c.reviewCount
                        ? ` · ${c.reviewCount.toLocaleString()} reviews`
                        : ''}
                    </span>
                  )}
                  {hasRevenue && (
                    <span className="text-[11px] font-medium text-muted-foreground/50">
                      {c.rating != null ? '· ' : ''}
                      {fmtRevenue(c.revenueEstimate!)}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 flex-1">
                {ins ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        Why users pick them
                      </span>
                      <p className="text-xs text-foreground/75 leading-snug">
                        {ins.whyChosen}
                      </p>
                    </div>
                    {ins.weakness && (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">
                            Your opening
                          </span>
                          {c.source === 'appstore' ? (
                            <span className="inline-flex items-center rounded px-1 py-px text-[9px] font-medium text-amber-400/70 ring-1 ring-amber-400/20">
                              ★ real reviews
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded px-1 py-px text-[9px] font-medium text-muted-foreground/40 ring-1 ring-border/40">
                              AI analysis
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/75 leading-snug">
                          {ins.weakness}
                        </p>
                      </div>
                    )}
                  </>
                ) : c.snippet ? (
                  <p className="text-xs text-muted-foreground/65 leading-snug line-clamp-3">
                    {c.snippet}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {marketHardness && (
        <p className="pt-3 border-t border-border/50 text-xs text-muted-foreground/60 leading-snug italic">
          {marketHardness}
        </p>
      )}
    </div>
  );
}

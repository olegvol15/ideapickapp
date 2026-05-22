'use client';

import { ExternalLink } from 'lucide-react';
import { CompetitorLogo } from '@/components/market/competitors-list/CompetitorLogo';
import { SectionHeading } from './SectionHeading';
import { findInsight } from '@/lib/validate/competitors';
import { cn } from '@/lib/utils';
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
    <div className="border-t border-border/30 pt-8 pb-8 flex flex-col gap-4">
      <SectionHeading>What the market is getting wrong</SectionHeading>
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
                  <CompetitorLogo domain={c.source} name={c.name} iconUrl={c.iconUrl} />
                  <span className="text-sm font-semibold text-foreground/90 truncate">
                    {c.name}
                  </span>
                </div>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {(c.rating != null || hasRevenue) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {c.rating != null && (
                    <span className="text-[11px] font-medium text-amber-400">
                      ★ {c.rating.toFixed(1)}
                      {c.reviewCount
                        ? ` · ${c.reviewCount.toLocaleString()} reviews`
                        : ''}
                    </span>
                  )}
                  {hasRevenue && (
                    <span className="text-[11px] font-medium text-muted-foreground/70">
                      {c.rating != null ? '· ' : ''}
                      {fmtRevenue(c.revenueEstimate!)}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 flex-1">
                {ins ? (
                  <>
                    {/* Complaints lead — these are the opportunities */}
                    {c.reviews && c.reviews.some((r) => r.sentiment === 'complaint') && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
                            What users hate
                          </span>
                          {c.source === 'appstore' && (
                            <span className="inline-flex items-center rounded px-1 py-px text-[9px] font-medium text-amber-400/70 ring-1 ring-amber-400/20">
                              ★ real reviews
                            </span>
                          )}
                        </div>
                        {c.reviews
                          .filter((r) => r.sentiment === 'complaint')
                          .map((r, i) => (
                            <div key={i} className="flex gap-1.5 items-start">
                              <span className="shrink-0 text-[10px] leading-snug mt-0.5 text-amber-400/80">
                                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                              </span>
                              <p className="text-[11px] text-foreground/70 leading-snug italic line-clamp-3">
                                &ldquo;{r.body}{r.body.length >= 140 ? '…' : ''}&rdquo;
                              </p>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Entry point — prominent */}
                    {ins.weakness && (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
                            Your entry point
                          </span>
                          {!c.reviews?.some((r) => r.sentiment === 'complaint') && c.source === 'appstore' && (
                            <span className="inline-flex items-center rounded px-1 py-px text-[9px] font-medium text-amber-400/70 ring-1 ring-amber-400/20">
                              ★ real reviews
                            </span>
                          )}
                          {!c.reviews?.some((r) => r.sentiment === 'complaint') && c.source !== 'appstore' && (
                            <span className="inline-flex items-center rounded px-1 py-px text-[9px] font-medium text-muted-foreground/60 ring-1 ring-border/60">
                              AI analysis
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/85 leading-snug font-medium">
                          {ins.weakness}
                        </p>
                      </div>
                    )}

                    {/* Positive reviews */}
                    {c.reviews && c.reviews.some((r) => r.sentiment === 'positive') && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-border/30">
                        {c.reviews
                          .filter((r) => r.sentiment === 'positive')
                          .map((r, i) => (
                            <div key={i} className="flex gap-1.5 items-start">
                              <span className="shrink-0 text-[10px] leading-snug mt-0.5 text-emerald-400/60">
                                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                              </span>
                              <p className="text-[11px] text-foreground/55 leading-snug italic line-clamp-2">
                                &ldquo;{r.body}{r.body.length >= 140 ? '…' : ''}&rdquo;
                              </p>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Why users still use it — deprioritized */}
                    <div className="flex flex-col gap-0.5 pt-1 border-t border-border/30">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45">
                        Why users still use it
                      </span>
                      <p className="text-xs text-foreground/55 leading-snug">
                        {ins.whyChosen}
                      </p>
                    </div>
                  </>
                ) : c.snippet ? (
                  <p className="text-xs text-muted-foreground/75 leading-snug line-clamp-3">
                    {c.snippet}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {marketHardness && (
        <p className="pt-3 border-t border-border/50 text-xs text-muted-foreground/70 leading-snug italic">
          {marketHardness}
        </p>
      )}
    </div>
  );
}

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

export function ValidationCompetitorsBlock({ result, competitors }: ValidationCompetitorsBlockProps) {
  const { competitorInsights, marketHardness } = result;
  const competitorItems = competitors.filter((c) => c.type !== 'signal').slice(0, 4);

  if (competitorItems.length === 0 && (!competitorInsights || competitorInsights.length === 0)) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-5 flex flex-col gap-4">
      <SectionHeading>Why users pick competitors over your idea</SectionHeading>
      <div className="flex flex-col gap-4">
        {competitorItems.map((c) => {
          const ins = findInsight(c, competitorInsights ?? []);
          return (
            <div key={c.url} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CompetitorLogo domain={c.source} name={c.name} />
                <span className="text-sm font-semibold text-foreground/90 truncate flex-1">{c.name}</span>
                {c.rating != null && (
                  <span className="text-[11px] font-medium text-amber-400/80 shrink-0">
                    ★ {c.rating.toFixed(1)}{c.reviewCount ? ` · ${c.reviewCount.toLocaleString()} reviews` : ''}
                  </span>
                )}
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground/60 hover:text-foreground bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="pl-[26px] flex flex-col gap-1.5">
                {ins ? (
                  <>
                    <p className="text-xs text-foreground/75 leading-snug">
                      <span className="font-semibold text-muted-foreground/60">Users pick them: </span>
                      {ins.whyChosen}
                    </p>
                    {ins.weakness && (
                      <p className="text-xs text-foreground/75 leading-snug">
                        <span className="font-semibold text-emerald-500/70">Your opening: </span>
                        {ins.weakness}
                      </p>
                    )}
                  </>
                ) : c.snippet ? (
                  <p className="text-xs text-muted-foreground/65 leading-snug line-clamp-2">{c.snippet}</p>
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

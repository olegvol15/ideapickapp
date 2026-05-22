'use client';

import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

interface NicheBlockProps {
  nicheAnalysis: {
    bestKeyword: string;
    evaluatedKeywords: string[];
    alternativeKeywords: string[];
    reasoning: string;
    comparisonNote?: string;
    bestKeywordScores: { opportunityScore: number; competitionScore: number };
  };
  bestEntryStrategy: 'ENTER_VIA_NICHE' | 'BROAD_MARKET' | 'NO_VIABLE_ENTRY';
}

const STRATEGY_CONFIG = {
  ENTER_VIA_NICHE: {
    label: 'Niche entry',
    className: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
  },
  BROAD_MARKET: {
    label: 'Broad market',
    className: 'bg-sky-500/15 text-sky-600 border border-sky-500/30',
  },
  NO_VIABLE_ENTRY: {
    label: 'No viable entry',
    className: 'bg-rose-500/15 text-rose-600 border border-rose-500/30',
  },
};

export function ValidationNicheBlock({ nicheAnalysis, bestEntryStrategy }: NicheBlockProps) {
  const { bestKeyword, evaluatedKeywords, alternativeKeywords, reasoning, comparisonNote, bestKeywordScores } = nicheAnalysis;
  const strategy = STRATEGY_CONFIG[bestEntryStrategy];

  const opportunityScore = Math.round(bestKeywordScores.opportunityScore * 10);
  const competitionScore = Math.round(bestKeywordScores.competitionScore * 10);

  const shownKeywords = evaluatedKeywords.filter((k) => k !== bestKeyword).slice(0, 3);
  const hiddenCount = Math.max(0, evaluatedKeywords.length - 1 - shownKeywords.length);

  return (
    <div className="flex flex-col gap-4 border-t border-border/30 pt-8 pb-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading>ASO keyword</SectionHeading>
          <span className={cn('text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded', strategy.className)}>
            {strategy.label}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground/60 font-medium">Best keyword to target</p>
          <p className="text-base font-bold text-foreground/90 leading-snug">
            &ldquo;{bestKeyword}&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className={cn(
              'text-xs font-semibold',
              opportunityScore >= 60 ? 'text-emerald-500' : opportunityScore >= 35 ? 'text-amber-500' : 'text-rose-500'
            )}>
              Opportunity {opportunityScore}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className={cn(
              'text-xs font-semibold',
              competitionScore >= 70 ? 'text-rose-500' : competitionScore >= 40 ? 'text-amber-500' : 'text-emerald-500'
            )}>
              Competition {competitionScore}
            </span>
          </div>
        </div>
      </div>

      {(reasoning || comparisonNote) && (
        <div className="flex flex-col gap-1.5 mt-1">
          {reasoning && (
            <p className="text-xs text-foreground/70 leading-snug">{reasoning}</p>
          )}
          {comparisonNote && (
            <p className="text-xs text-muted-foreground/55 leading-snug italic">{comparisonNote}</p>
          )}
        </div>
      )}

      {(shownKeywords.length > 0 || alternativeKeywords.length > 0) && (
        <div className="flex flex-col gap-1.5 mt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Also evaluated
          </p>
          <div className="flex flex-wrap gap-1.5">
            {shownKeywords.map((kw) => (
              <span
                key={kw}
                className="text-[11px] text-muted-foreground/70 bg-muted/40 border border-border/60 rounded px-2 py-0.5"
              >
                {kw}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="text-[11px] text-muted-foreground/40 px-1 py-0.5">
                +{hiddenCount} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

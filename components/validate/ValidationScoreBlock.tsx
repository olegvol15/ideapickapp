'use client';

import { cn } from '@/lib/utils';
import { colorClass } from '@/lib/validate/colors';
import { getMarketReality, getEntryPossibility, computeEntryDifficulty } from '@/lib/validate/scores';
import { getDecisionStatement } from '@/lib/validate/decision';
import { buildScoreExplanation } from '@/lib/validate/narratives';
import { cap } from '@/lib/validate/scores';
import { MetricBar } from './MetricBar';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { IdeaContext } from '@/types/validate.types';

interface ValidationScoreBlockProps {
  result: EnhancedValidationResult;
  ideaContext?: IdeaContext;
}

export function ValidationScoreBlock({ result, ideaContext }: ValidationScoreBlockProps) {
  const { score, painScore, competitionScore, opportunityScore, confidence, confidenceReason, nicheAnalysis, bestEntryStrategy } = result;

  const marketReality      = getMarketReality(result);
  const { label: marketLabel, sublabel: marketSublabel, color: marketColor, Icon: MarketIcon, structureNote } = marketReality;
  const entryConfig        = getEntryPossibility(result);
  const decisionStatement  = getDecisionStatement(result);
  const entryDifficulty    = computeEntryDifficulty(result);
  const compExplanation    = buildScoreExplanation('competition', competitionScore, result, ideaContext);
  const painExplanation    = buildScoreExplanation('pain', painScore, result, ideaContext);
  const oppExplanation     = buildScoreExplanation('opportunity', opportunityScore, result, ideaContext);

  const nicheOpportunityScore = nicheAnalysis
    ? Math.round(nicheAnalysis.bestKeywordScores.opportunityScore * 10)
    : null;

  return (
    <div className={cn(
      'rounded-xl border px-6 py-6',
      marketColor === 'emerald' && 'border-emerald-500/25 bg-emerald-500/[0.05]',
      marketColor === 'amber'   && 'border-amber-500/25   bg-amber-500/[0.05]',
      marketColor === 'rose'    && 'border-rose-500/25    bg-rose-500/[0.05]',
    )}>
      {/* Verdict label + score */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <MarketIcon className={cn('h-6 w-6 shrink-0 mt-0.5', colorClass(marketColor, 'text'))} />
          <div>
            <span className={cn('text-3xl font-black tracking-tight leading-none block', colorClass(marketColor, 'text'))}>
              {marketLabel}
            </span>
            {marketSublabel && (
              <p className={cn('mt-1 text-xs font-semibold tracking-wide opacity-70', colorClass(marketColor, 'text'))}>
                {marketSublabel}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className={cn('text-2xl font-black tabular-nums leading-none', colorClass(marketColor, 'text'))}>{score}</span>
          <span className="text-[10px] text-muted-foreground/50 font-medium">/ 100</span>
        </div>
      </div>

      {/* Structure note */}
      {structureNote && (
        <div className={cn(
          'mt-3 rounded-lg px-3.5 py-2.5 border text-xs leading-snug',
          marketColor === 'amber'   && 'bg-amber-500/[0.06]   border-amber-500/20   text-amber-300/80',
          marketColor === 'emerald' && 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-300/80',
          marketColor === 'rose'    && 'bg-rose-500/[0.06]    border-rose-500/20    text-rose-300/80',
        )}>
          {structureNote}
        </div>
      )}

      {/* Entry possibility + decision statement */}
      {entryConfig.show && (
        <div className="mt-3 flex items-center gap-2">
          <entryConfig.Icon className={cn('h-3.5 w-3.5 shrink-0', colorClass(entryConfig.color, 'text'))} />
          <span className={cn('text-sm font-semibold tracking-wide', colorClass(entryConfig.color, 'text'))}>
            {entryConfig.label}
          </span>
        </div>
      )}
      {decisionStatement && (
        <p className="mt-3 text-sm font-semibold text-foreground/85 leading-snug">{decisionStatement}</p>
      )}

      {/* Score breakdown */}
      <div className="mt-5 pt-4 border-t border-border/40 flex flex-col gap-4">
        <MetricBar label="Competition"        score={competitionScore} invert explanation={compExplanation} />
        <MetricBar label="Demand (pain)"      score={painScore}              explanation={painExplanation} />
        <MetricBar label="Market opportunity" score={opportunityScore}        explanation={oppExplanation} />
        {nicheOpportunityScore != null && bestEntryStrategy === 'ENTER_VIA_NICHE' && nicheAnalysis && (
          <div className="pt-2 border-t border-border/40">
            <div className="grid grid-cols-[128px_minmax(60px,auto)_minmax(0,1fr)_32px] items-center gap-3">
              <span className="text-sm font-semibold text-foreground/80">Niche opportunity</span>
              <span className={cn('text-[11px] font-bold tracking-wider',
                nicheOpportunityScore >= 60 ? 'text-emerald-500' : 'text-amber-500'
              )}>
                {nicheOpportunityScore >= 60 ? 'STRONG' : nicheOpportunityScore >= 35 ? 'VIABLE' : 'LIMITED'}
              </span>
              <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-700',
                    nicheOpportunityScore >= 60 ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, nicheOpportunityScore))}%` }}
                />
              </div>
              <span className="text-right text-xs font-semibold tabular-nums text-muted-foreground/50">{nicheOpportunityScore}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground/45 pl-[calc(128px+12px)]">
              for &ldquo;{nicheAnalysis.bestKeyword}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Confidence + difficulty */}
      <div className="mt-4 pt-3.5 border-t border-border/40 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground/70">Entry difficulty:</span>
          <span className={cn('text-xs font-bold',
            entryDifficulty === 'HIGH' ? 'text-rose-500' : entryDifficulty === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'
          )}>{entryDifficulty}</span>
          <span className="text-xs text-muted-foreground/60">
            {entryDifficulty === 'HIGH'   ? '— high quality bar, concentrated reviews'
             : entryDifficulty === 'MEDIUM' ? '— moderate incumbents, room to differentiate'
             : '— low barriers, good window to enter'}
          </span>
        </div>
        {confidence && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground/70">Confidence:</span>
            <span className={cn('text-xs font-bold', colorClass(
              confidence === 'high' ? 'emerald' : confidence === 'medium' ? 'amber' : 'rose', 'text'
            ))}>{cap(confidence)}</span>
            {confidenceReason && (
              <span className="text-xs text-muted-foreground/50">— {confidenceReason}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

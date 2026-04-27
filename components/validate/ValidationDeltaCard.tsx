'use client';

import { cn } from '@/lib/utils';
import { computeDelta } from '@/lib/validate/scores';
import type { EnhancedValidationResult } from '@/lib/schemas';

interface ValidationDeltaCardProps {
  result: EnhancedValidationResult;
  previousResult: EnhancedValidationResult;
}

export function ValidationDeltaCard({
  result,
  previousResult,
}: ValidationDeltaCardProps) {
  const delta = computeDelta(previousResult, result);
  const { competitionScore, opportunityScore, score } = result;

  return (
    <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          vs previous version
        </p>
        {delta.decisionChanged && (
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
              result.decision === 'proceed'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : result.decision === 'drop'
                  ? 'bg-rose-500/10    text-rose-400    border-rose-500/20'
                  : 'bg-amber-500/10   text-amber-400   border-amber-500/20'
            )}
          >
            Decision changed
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/55">Score</span>
          <span className="text-sm font-mono text-muted-foreground/55">
            {previousResult.score}
          </span>
          <span className="text-xs text-muted-foreground/30">→</span>
          <span
            className={cn(
              'text-sm font-mono font-bold',
              delta.scoreDiff > 0
                ? 'text-emerald-400'
                : delta.scoreDiff < 0
                  ? 'text-rose-400'
                  : 'text-muted-foreground/55'
            )}
          >
            {score}
          </span>
          {delta.scoreDiff !== 0 && (
            <span
              className={cn(
                'text-xs font-semibold',
                delta.scoreDiff > 0 ? 'text-emerald-400/70' : 'text-rose-400/70'
              )}
            >
              {delta.scoreDiff > 0 ? `+${delta.scoreDiff}` : delta.scoreDiff}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/55">Competition</span>
          <span className="text-xs font-mono text-muted-foreground/50">
            {previousResult.competitionScore}
          </span>
          <span className="text-xs text-muted-foreground/30">→</span>
          <span
            className={cn(
              'text-xs font-mono font-bold',
              delta.competitionDiff < 0
                ? 'text-emerald-400'
                : delta.competitionDiff > 0
                  ? 'text-rose-400'
                  : 'text-muted-foreground/55'
            )}
          >
            {competitionScore}
          </span>
          {delta.competitionDiff !== 0 && (
            <span
              className={cn(
                'text-[10px] font-medium',
                delta.competitionDiff < 0
                  ? 'text-emerald-400/60'
                  : 'text-rose-400/60'
              )}
            >
              {delta.competitionDiff < 0 ? '↓ lower' : '↑ higher'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/55">Opportunity</span>
          <span className="text-xs font-mono text-muted-foreground/50">
            {previousResult.opportunityScore}
          </span>
          <span className="text-xs text-muted-foreground/30">→</span>
          <span
            className={cn(
              'text-xs font-mono font-bold',
              delta.opportunityDiff > 0
                ? 'text-emerald-400'
                : delta.opportunityDiff < 0
                  ? 'text-rose-400'
                  : 'text-muted-foreground/55'
            )}
          >
            {opportunityScore}
          </span>
          {delta.opportunityDiff !== 0 && (
            <span
              className={cn(
                'text-[10px] font-medium',
                delta.opportunityDiff > 0
                  ? 'text-emerald-400/60'
                  : 'text-rose-400/60'
              )}
            >
              {delta.opportunityDiff > 0 ? '↑ better' : '↓ worse'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

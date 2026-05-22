'use client';

import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import type { DistributionAnalysis } from '@/lib/schemas';

interface ValidationDistributionBlockProps {
  distributionAnalysis: DistributionAnalysis;
}

const DIFFICULTY_STYLE = {
  easy: 'bg-emerald-500/10 text-emerald-500/80 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-500/80 border-amber-500/20',
  hard: 'bg-rose-500/10 text-rose-500/80 border-rose-500/20',
};

export function ValidationDistributionBlock({
  distributionAnalysis,
}: ValidationDistributionBlockProps) {
  const { reachable, channels, difficulty, reasoning } = distributionAnalysis;

  return (
    <div className="border-t border-border/30 pt-8 pb-8 flex flex-col gap-4">
      <SectionHeading>Distribution Analysis</SectionHeading>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            'text-xl font-black leading-none',
            reachable ? 'text-emerald-500' : 'text-rose-500'
          )}
        >
          {reachable ? 'REACHABLE' : 'HARD TO REACH'}
        </span>
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
            DIFFICULTY_STYLE[difficulty]
          )}
        >
          {difficulty}
        </span>
      </div>

      {channels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {channels.map((c) => (
            <span
              key={c}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-foreground/70 border border-border/40"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-foreground/70 leading-relaxed">{reasoning}</p>
    </div>
  );
}

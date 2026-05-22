'use client';

import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import type { Wedge } from '@/lib/schemas';

interface ValidationWedgesBlockProps {
  wedges: Wedge[];
}

export function ValidationWedgesBlock({ wedges }: ValidationWedgesBlockProps) {
  if (wedges.length === 0) return null;

  return (
    <div className="border-t border-border/30 pt-8 pb-8 flex flex-col gap-4">
      <SectionHeading>Entry Wedges</SectionHeading>
      <div className="flex flex-col gap-3">
        {wedges.map((wedge, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 flex flex-col gap-1.5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-foreground/90 leading-snug">
                {wedge.keyword}
              </span>
              <span
                className={cn(
                  'shrink-0 text-sm font-black tabular-nums leading-none',
                  wedge.score >= 65
                    ? 'text-emerald-500'
                    : wedge.score >= 45
                      ? 'text-amber-500'
                      : 'text-rose-500'
                )}
              >
                {wedge.score}
              </span>
            </div>
            <p className="text-sm text-foreground/75 leading-snug">
              {wedge.angle}
            </p>
            <p className="text-xs text-muted-foreground/60 leading-snug">
              <span className="font-semibold text-muted-foreground/70">
                Who:{' '}
              </span>
              {wedge.targetUser}
            </p>
            <p className="text-xs text-muted-foreground/55 leading-snug italic">
              {wedge.whyNow}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

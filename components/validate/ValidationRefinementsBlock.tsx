'use client';

import { cn } from '@/lib/utils';
import { SUGGESTION_TYPE_STYLE } from '@/lib/validate/colors';
import { buildRefinements } from '@/lib/validate/narratives';
import { SectionHeading } from './SectionHeading';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { IdeaContext } from '@/types/validate.types';

interface ValidationRefinementsBlockProps {
  result: EnhancedValidationResult;
  ideaContext?: IdeaContext;
}

export function ValidationRefinementsBlock({
  result,
  ideaContext,
}: ValidationRefinementsBlockProps) {
  const refinements = buildRefinements(result, ideaContext);
  if (refinements.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-5 flex flex-col gap-3.5">
      <SectionHeading>Refinements to consider</SectionHeading>
      <div className="flex flex-col gap-3">
        {refinements.map((r, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/15 px-4 py-3"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0',
                  SUGGESTION_TYPE_STYLE[r.type]
                )}
              >
                {r.type}
              </span>
              <span className="text-sm font-semibold text-foreground/90 leading-snug">
                {r.title}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/65 leading-snug">
              {r.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { SUGGESTION_TYPE_STYLE } from '@/lib/validate/colors';
import { buildRefinements, type Refinement } from '@/lib/validate/narratives';
import { SectionHeading } from './SectionHeading';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { IdeaContext } from '@/types/validate.types';

interface ValidationRefinementsBlockProps {
  result: EnhancedValidationResult;
  ideaContext?: IdeaContext;
  onApply?: (refinedDescription: string) => void;
}

function buildRefinedDescription(original: string, r: Refinement): string {
  return `${original} — specifically: ${r.title.toLowerCase()}`;
}

export function ValidationRefinementsBlock({
  result,
  ideaContext,
  onApply,
}: ValidationRefinementsBlockProps) {
  const refinements = buildRefinements(result, ideaContext);
  if (refinements.length === 0) return null;

  const originalDescription = ideaContext?.description ?? '';

  return (
    <div className="border-t border-border/30 pt-8 pb-8 flex flex-col gap-3.5">
      <SectionHeading>Angles worth testing</SectionHeading>
      <div className="flex flex-col gap-3">
        {refinements.map((r, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/10 px-4 py-3"
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
            {onApply && originalDescription && (
              <button
                onClick={() => onApply(buildRefinedDescription(originalDescription, r))}
                className="mt-1 self-end flex items-center gap-1 text-xs font-semibold text-foreground/60 hover:text-foreground transition-colors"
              >
                Validate this angle <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

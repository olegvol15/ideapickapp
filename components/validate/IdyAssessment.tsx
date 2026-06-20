'use client';

import { useMemo } from 'react';
import { IdeaPickMascot } from '@/components/brand/IdeaPickMascot';
import { randomFounderQuote } from '@/constants/founder-quotes';

interface IdyAssessmentProps {
  assessment: string;
}

export function IdyAssessment({ assessment }: IdyAssessmentProps) {
  const quote = useMemo(() => randomFounderQuote(), []);

  return (
    <div className="flex gap-4">
      <div
        className="group relative shrink-0 cursor-help self-start"
        tabIndex={0}
        aria-label="Idy"
      >
        <IdeaPickMascot
          background={false}
          className="h-20 w-20 drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]"
        />
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-60 -translate-x-1/2 rounded-3xl border border-border bg-card px-4 py-3 text-center text-xs font-medium italic leading-snug text-foreground/85 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {quote}
          {/* comic-bubble tail pointing down at Idy */}
          <span className="absolute left-1/2 top-full h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-br-[3px] border-b border-r border-border bg-card" />
        </div>
      </div>
      <p className="min-w-0 flex-1 self-center text-[15px] leading-relaxed text-foreground/85">
        {assessment}
      </p>
    </div>
  );
}

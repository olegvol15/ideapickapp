'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import { IdeaPickMascot } from '@/components/brand/IdeaPickMascot';
import { randomFounderQuote } from '@/constants/founder-quotes';
import { useValidateStore } from '@/stores/validate.store';
import { scoreTier } from '@/lib/validate/score-tier';
import type { ScoreTier } from '@/lib/validate/score-tier';

interface IdyAssessmentProps {
  assessment: string;
  score?: number;
  // Stable id for the report; the reveal animation plays only the first time a
  // given id is shown (persisted), not on every mount.
  revealId?: string;
}

// Body reaction that plays alongside the in-SVG bulb reveal: an excited hop for
// a strong idea, a small nod for promising, a let-down slump for weak. Timed to
// land with the bulb (~0.9s) and settle within the ~2.5s reveal window.
const BODY_REACTION: Record<ScoreTier, TargetAndTransition> = {
  strong: {
    y: [0, 0, -10, 0, -4, 0],
    transition: { duration: 2.4, times: [0, 0.38, 0.5, 0.62, 0.72, 0.82] },
  },
  promising: {
    y: [0, 0, -3, 0],
    transition: { duration: 2.4, times: [0, 0.42, 0.55, 0.7] },
  },
  weak: {
    y: [0, 0, 3],
    rotate: [0, 0, -3],
    transition: { duration: 2.4, times: [0, 0.5, 0.78] },
  },
};

export function IdyAssessment({
  assessment,
  score,
  revealId,
}: IdyAssessmentProps) {
  const quote = useMemo(() => randomFounderQuote(), []);
  const reduced = useReducedMotion();
  const tier = score != null ? scoreTier(score) : undefined;

  // Decide once, at first render, whether this report's reveal should play.
  const [firstTime] = useState(() => {
    if (!tier) return false;
    if (!revealId) return true; // live flow: no id → treat as first render
    return !useValidateStore.getState().seenReveals.includes(revealId);
  });
  useEffect(() => {
    if (firstTime && revealId) {
      useValidateStore.getState().markRevealSeen(revealId);
    }
  }, [firstTime, revealId]);
  const play = firstTime && !reduced;

  return (
    <div className="flex gap-4">
      <div
        className="group relative shrink-0 cursor-help self-start"
        tabIndex={0}
        aria-label="Idy"
      >
        {/* Outer: pop-in entrance. Inner: tier body reaction (hop/nod/slump).
            Only the first view of a report plays; later views render at rest. */}
        <motion.div
          initial={play ? { opacity: 0, scale: 0.5, y: 8 } : false}
          animate={play ? { opacity: 1, scale: 1, y: 0 } : undefined}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          style={{ transformOrigin: 'center bottom' }}
        >
          <motion.div animate={play && tier ? BODY_REACTION[tier] : undefined}>
            <IdeaPickMascot
              reveal={tier}
              play={play}
              background={false}
              className="h-20 w-20 drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]"
            />
          </motion.div>
        </motion.div>
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

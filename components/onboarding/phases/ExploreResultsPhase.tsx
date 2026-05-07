'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExploreIdea } from '@/types';
import { fade } from '@/constants/onboarding';

interface Props {
  exploreIdeas: ExploreIdea[];
  carouselIdx: number;
  carouselDir: number;
  hasRefined: boolean;
  saving: boolean;
  error: string | null;
  goToCarousel: (idx: number) => void;
  onSave: (idea: ExploreIdea) => void;
  onAdjust: () => void;
}

export function ExploreResultsPhase({
  exploreIdeas, carouselIdx, carouselDir, hasRefined, saving, error,
  goToCarousel, onSave, onAdjust,
}: Props) {
  const card = exploreIdeas[carouselIdx];

  return (
    <motion.div key="explore-results" {...fade} className="space-y-6">
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={carouselDir}>
          <motion.div
            key={carouselIdx}
            custom={carouselDir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div>
              <p className="text-base font-bold text-white leading-snug">{card.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{card.description}</p>
            </div>

            <div className="h-px w-full bg-white/[0.07]" />

            <div>
              <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest text-white/25">Why</p>
              <ul className="space-y-2">
                {card.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
                    <span className="mt-0.5 shrink-0 text-[10px] font-bold text-[#0077b6]">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="h-px w-full bg-white/[0.07]" />

            <div>
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/25">Your next move</p>
              <p className="text-sm leading-relaxed text-white/50">{card.nextStep}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => goToCarousel(carouselIdx - 1)}
          disabled={carouselIdx === 0}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-25 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {exploreIdeas.map((_, i) => (
            <button
              key={i}
              onClick={() => goToCarousel(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === carouselIdx ? 'w-6 bg-[#0077b6]' : 'w-1.5 bg-white/20 hover:bg-white/35'
              )}
            />
          ))}
        </div>
        <button
          onClick={() => goToCarousel(carouselIdx + 1)}
          disabled={carouselIdx === exploreIdeas.length - 1}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-25 disabled:pointer-events-none"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <Button
        className="w-full bg-[#0077b6] text-white hover:bg-[#0066a0] font-medium"
        disabled={saving}
        onClick={() => onSave(card)}
      >
        {saving
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
          : 'Start with this idea →'}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-[11px] text-white/20">Not quite right?</p>
        <div className="flex items-center justify-center gap-4">
          {!hasRefined && (
            <button
              onClick={onAdjust}
              disabled={saving}
              className="text-xs text-white/35 underline underline-offset-2 transition-colors hover:text-white/60 disabled:pointer-events-none disabled:opacity-40"
            >
              Adjust direction
            </button>
          )}
          <button
            onClick={() => onSave(card)}
            disabled={saving}
            className="text-xs text-white/35 underline underline-offset-2 transition-colors hover:text-white/60 disabled:pointer-events-none disabled:opacity-40"
          >
            Continue anyway
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </motion.div>
  );
}

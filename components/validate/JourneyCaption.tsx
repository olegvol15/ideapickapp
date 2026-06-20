'use client';

import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompetitorLogo } from '@/components/market/competitors-list/CompetitorLogo';
import { useCyclingLabel } from '@/hooks/use-cycling-label';
import { SCORING_LABELS } from '@/constants/scoring';
import { getSearchKeywords } from '@/lib/validate/progress';
import type { Phase } from '@/lib/validate/progress';
import type { EvidenceSource } from '@/types/validate.types';

interface JourneyCaptionProps {
  phase: Phase;
  sources: EvidenceSource[];
  description: string;
}

const STAGGER = {
  show: { transition: { staggerChildren: 0.07 } },
};

const ITEM = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0, transition: { duration: 0.22 } },
};

const MAX_VISIBLE_SOURCES = 6;

const HEADINGS: Record<Phase, string> = {
  thinking: 'Preparing complaint searches',
  researching: 'Searching Reddit, forums & communities',
  analyzing: 'Grouping complaints into themes',
};

export function JourneyCaption({ phase, sources, description }: JourneyCaptionProps) {
  const scoringLabel = useCyclingLabel(phase === 'analyzing', SCORING_LABELS);
  const searchKeywords = getSearchKeywords(description);

  const webSources = sources.filter((s) => s.kind === 'web');
  const visibleSources = webSources.slice(0, MAX_VISIBLE_SOURCES);
  const hiddenCount = webSources.length - visibleSources.length;

  return (
    <div className="mt-4 min-h-[6.5rem]">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center text-center"
        >
          <p className="text-lg font-medium leading-none text-foreground/90">
            {HEADINGS[phase]}
          </p>

          {phase === 'thinking' && (
            <motion.ul
              variants={STAGGER}
              initial="hidden"
              animate="show"
              className="mt-3 flex flex-col items-center gap-1.5"
            >
              {searchKeywords.map((kw) => (
                <motion.li
                  key={kw}
                  variants={ITEM}
                  className="flex items-center gap-2 text-sm text-muted-foreground/50"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                  {kw}
                </motion.li>
              ))}
            </motion.ul>
          )}

          {phase === 'researching' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground/50">
              <Pulse />
              Scanning discussions and forum threads…
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="mt-3 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
                <Pulse />
                {scoringLabel}
              </div>
              {webSources.length > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground/40">
                    Found {webSources.length} source{webSources.length !== 1 ? 's' : ''}
                  </p>
                  <motion.ul
                    variants={STAGGER}
                    initial="hidden"
                    animate="show"
                    className="flex flex-wrap justify-center gap-x-4 gap-y-1.5"
                  >
                    {visibleSources.map((c) => (
                      <motion.li
                        key={c.url}
                        variants={ITEM}
                        className="flex items-center gap-2 text-sm text-muted-foreground/55"
                      >
                        <CompetitorLogo domain={c.source} name={c.name} />
                        <span className="max-w-[10rem] truncate">{c.name}</span>
                      </motion.li>
                    ))}
                    {hiddenCount > 0 && (
                      <motion.li
                        variants={ITEM}
                        className="self-center text-sm text-muted-foreground/40"
                      >
                        +{hiddenCount} more
                      </motion.li>
                    )}
                  </motion.ul>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Pulse() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground/50 opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
    </span>
  );
}

'use client';

import { Search, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompetitorLogo } from '@/components/market/competitors-list/CompetitorLogo';
import { useCyclingLabel } from '@/hooks/use-cycling-label';
import { SCORING_LABELS } from '@/constants/scoring';
import { stepStatus, getSearchKeywords } from '@/lib/validate/progress';
import type { StepStatus } from '@/lib/validate/progress';
import type { EvidenceSource } from '@/types/validate.types';

type Phase = 'thinking' | 'researching' | 'analyzing';

interface ValidationProgressProps {
  phase: Phase;
  sources: EvidenceSource[];
  description: string;
  onCancel: () => void;
}

const STAGGER = {
  show: { transition: { staggerChildren: 0.07 } },
};

const ITEM = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0, transition: { duration: 0.22 } },
};

const MAX_VISIBLE_SOURCES = 6;

export function ValidationProgress({
  phase,
  sources,
  description,
  onCancel,
}: ValidationProgressProps) {
  const scoringLabel = useCyclingLabel(phase === 'analyzing', SCORING_LABELS);
  const searchKeywords = getSearchKeywords(description);

  const allSources = sources.filter((s) => s.kind === 'web');
  const visibleSources = allSources.slice(0, MAX_VISIBLE_SOURCES);
  const hiddenCount = allSources.length - visibleSources.length;
  const totalFound = sources.length;

  const queriesStatus = stepStatus('queries', phase);
  const researchStatus = stepStatus('research', phase);
  const scoringStatus = stepStatus('scoring', phase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col"
    >
      {/* Description pill */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-10 inline-flex max-w-full self-start rounded-full border border-border/40 bg-muted/30 px-4 py-2"
      >
        <p className="truncate text-sm text-muted-foreground/60 leading-snug">
          {description.trim().slice(0, 90)}{description.trim().length > 90 ? '…' : ''}
        </p>
      </motion.div>

      {/* Steps */}
      <div className="flex flex-col">
        <Step
          status={queriesStatus}
          label="Preparing complaint searches"
          isLast={false}
          delay={0.15}
        >
          <AnimatePresence>
            {queriesStatus !== 'pending' && (
              <motion.ul
                key="queries-list"
                variants={STAGGER}
                initial="hidden"
                animate="show"
                className="mt-2.5 flex flex-col gap-1.5"
              >
                {searchKeywords.map((kw) => (
                  <motion.li
                    key={kw}
                    variants={ITEM}
                    className="flex items-center gap-2 text-xs text-muted-foreground/40"
                  >
                    <Search className="h-3 w-3 shrink-0 text-muted-foreground/25" />
                    {kw}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </Step>

        <Step
          status={researchStatus}
          label="Searching Reddit, forums & communities"
          isLast={false}
          delay={0.22}
        >
          <AnimatePresence mode="wait">
            {researchStatus === 'active' && (
              <motion.div
                key="research-active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground/40"
              >
                <Pulse />
                Scanning discussions and forum threads…
              </motion.div>
            )}
            {researchStatus === 'done' && (
              <motion.div
                key="research-done"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-2.5 flex flex-col gap-2"
              >
                <p className="text-xs text-muted-foreground/30">
                  Found {totalFound} source{totalFound !== 1 ? 's' : ''}
                </p>
                <motion.ul
                  variants={STAGGER}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-1.5"
                >
                  {visibleSources.map((c) => (
                    <motion.li
                      key={c.url}
                      variants={ITEM}
                      className="flex items-center gap-2 text-xs text-muted-foreground/50"
                    >
                      <CompetitorLogo domain={c.source} name={c.name} />
                      <span className="truncate">{c.name}</span>
                      {c.source && (
                        <span className="shrink-0 text-[11px] text-muted-foreground/25">
                          {c.source}
                        </span>
                      )}
                    </motion.li>
                  ))}
                  {hiddenCount > 0 && (
                    <motion.li variants={ITEM} className="ml-6 text-xs text-muted-foreground/30">
                      +{hiddenCount} more
                    </motion.li>
                  )}
                </motion.ul>
              </motion.div>
            )}
          </AnimatePresence>
        </Step>

        <Step
          status={scoringStatus}
          label="Grouping complaints into themes"
          isLast
          delay={0.29}
        >
          <AnimatePresence>
            {scoringStatus === 'active' && (
              <motion.div
                key="scoring-active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground/40"
              >
                <Pulse />
                {scoringLabel}
              </motion.div>
            )}
          </AnimatePresence>
        </Step>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="mt-8 mx-auto text-xs text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-transparent"
      >
        Cancel
      </Button>
    </motion.div>
  );
}

interface StepProps {
  status: StepStatus;
  label: string;
  isLast: boolean;
  delay: number;
  children?: React.ReactNode;
}

function Step({ status, label, isLast, delay, children }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
          {status === 'done' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.5} />
            </motion.div>
          )}
          {status === 'active' && (
            <Loader2 className="h-5 w-5 animate-spin text-foreground/50" />
          )}
          {status === 'pending' && (
            <div className="h-4 w-4 rounded-full border border-muted-foreground/20" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              'mt-2 mb-1 min-h-[24px] w-px flex-1 transition-colors duration-700',
              status === 'done' ? 'bg-emerald-500/20' : 'bg-border/25'
            )}
          />
        )}
      </div>

      <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-6')}>
        <p
          className={cn(
            'text-[15px] font-medium leading-none',
            status === 'done' && 'text-foreground/35',
            status === 'active' && 'text-foreground/90',
            status === 'pending' && 'text-muted-foreground/25'
          )}
        >
          {label}
        </p>
        {children}
      </div>
    </motion.div>
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

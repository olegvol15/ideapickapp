'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OpportunityCard } from '@/components/opportunity/opportunity-card';
import { OpportunityModal } from '@/components/opportunity/opportunity-modal';
import { MarketDashboard } from '@/components/market/market-dashboard';
import { CompetitorsList } from '@/components/market/competitors-list';
import type { GenerateResponse, Idea } from '@/types';

type Tab = 'opportunities' | 'market' | 'competitors';

interface TabDefinition {
  id: Tab;
  label: string;
}

const TABS: TabDefinition[] = [
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'market', label: 'Market' },
  { id: 'competitors', label: 'Competitors' },
];

interface ResultsTabsProps {
  result: GenerateResponse;
  visibleCount: number;
  generationId?: string | null;
}

export function ResultsTabs({
  result,
  visibleCount,
  generationId,
}: ResultsTabsProps) {
  const [active, setActive] = useState<Tab>('opportunities');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  return (
    <>
      <div>
        <div className="flex border-b border-border mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                'relative px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-150',
                active === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground/60 hover:text-foreground'
              )}
            >
              {tab.label}
              {active === tab.id && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {active === 'opportunities' && (
              <div className="grid gap-3">
                <AnimatePresence>
                  {result.ideas.slice(0, visibleCount).map((idea) => (
                    <motion.div
                      key={idea.title}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.38, ease: 'easeOut' }}
                    >
                      <OpportunityCard
                        {...idea}
                        generationId={generationId}
                        onExplore={() => setSelectedIdea(idea)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {active === 'market' && (
              <MarketDashboard
                marketContext={result.marketContext}
                gaps={result.gaps}
              />
            )}

            {active === 'competitors' && (
              <CompetitorsList competitors={result.competitorAnalysis} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <OpportunityModal
        idea={selectedIdea}
        generationId={generationId}
        onClose={() => setSelectedIdea(null)}
      />
    </>
  );
}

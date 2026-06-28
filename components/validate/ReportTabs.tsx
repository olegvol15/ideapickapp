'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ReportTab {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
}

interface ReportTabsProps {
  tabs: ReportTab[];
}

export function ReportTabs({ tabs }: ReportTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id);

  if (tabs.length === 0) return null;

  // A lone tab needs no bar — just show its content.
  if (tabs.length === 1) {
    return <div>{tabs[0].content}</div>;
  }

  const activeTab = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-6 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                'relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground/70 hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="report-tab-pill"
                  className="absolute inset-0 rounded-full border border-border/60 bg-background shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted-foreground/10 text-muted-foreground/50'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {activeTab.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

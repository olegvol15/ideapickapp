'use client';

import { Search, BarChart2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompetitorLogo } from '@/components/market/competitors-list/CompetitorLogo';
import { Pulse } from './Pulse';
import { StepIcon } from './StepIcon';
import { useCyclingLabel } from '@/hooks/use-cycling-label';
import { stepStatus, getSearchKeywords } from '@/lib/validate/progress';
import type { StepStatus } from '@/lib/validate/progress';
import type { Competitor } from '@/types';

type Phase = 'thinking' | 'researching' | 'analyzing';

interface ValidationProgressProps {
  phase: Phase;
  competitors: Competitor[];
  productType: string;
  description: string;
  onCancel: () => void;
}

export function ValidationProgress({
  phase, competitors, productType, description, onCancel,
}: ValidationProgressProps) {
  const scoringLabel    = useCyclingLabel(phase === 'analyzing');
  const isMobile        = productType === 'Mobile App';
  const searchKeywords  = getSearchKeywords(description, isMobile);
  const competitorItems = competitors.filter((c) => c.type !== 'signal').slice(0, 5);
  const signalItems     = competitors.filter((c) => c.type === 'signal').slice(0, 4);
  const totalFound      = competitors.length;

  return (
    <div className="mt-8 flex flex-col gap-8">
      <div className="flex flex-col">

        <Step status={stepStatus('queries', phase)} icon={Search} label="Preparing research queries" isLast={false}>
          {stepStatus('queries', phase) === 'done' && (
            <ul className="flex flex-col gap-1.5 mt-2">
              {searchKeywords.map((kw) => (
                <li key={kw} className="flex items-center gap-2 text-xs text-muted-foreground/55">
                  <Search className="h-3 w-3 shrink-0 text-muted-foreground/35" />
                  {kw}
                </li>
              ))}
            </ul>
          )}
        </Step>

        <Step
          status={stepStatus('research', phase)}
          icon={FileText}
          label={isMobile ? 'Searching App Store & web signals' : 'Searching market & web signals'}
          isLast={false}
        >
          {stepStatus('research', phase) === 'active' && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/50">
              <Pulse />
              <span>{isMobile ? 'Fetching App Store results…' : 'Scanning market signals…'}</span>
            </div>
          )}
          {stepStatus('research', phase) === 'done' && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-[11px] text-muted-foreground/50">
                Found {totalFound} source{totalFound !== 1 ? 's' : ''}
              </p>
              {competitorItems.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {competitorItems.map((c) => (
                    <li key={c.url} className="flex items-center gap-2 text-xs text-muted-foreground/60">
                      <CompetitorLogo domain={c.source} name={c.name} />
                      <span className="truncate">{c.name}</span>
                      {c.source && <span className="text-muted-foreground/35 shrink-0">{c.source}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {signalItems.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {signalItems.map((c) => (
                    <li key={c.url} className="flex items-center gap-2 text-xs text-muted-foreground/60">
                      <CompetitorLogo domain={c.source} name={c.name} />
                      <span className="truncate">{c.name}</span>
                      <span className="text-muted-foreground/35 shrink-0">{c.source}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Step>

        <Step status={stepStatus('scoring', phase)} icon={BarChart2} label="Scoring signals & generating report" isLast>
          {stepStatus('scoring', phase) === 'active' && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/50">
              <Pulse />
              <span>{scoringLabel}</span>
            </div>
          )}
        </Step>
      </div>

      <button
        onClick={onCancel}
        className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors w-fit mx-auto"
      >
        Cancel
      </button>
    </div>
  );
}

interface StepProps {
  status: StepStatus;
  icon: React.ElementType;
  label: string;
  isLast: boolean;
  children?: React.ReactNode;
}

function Step({ status, icon, label, isLast, children }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="mt-0.5">
          <StepIcon status={status} Icon={icon} />
        </div>
        {!isLast && (
          <div className={cn(
            'w-px flex-1 mt-2 mb-1 min-h-[20px]',
            status === 'done' ? 'bg-emerald-500/25' : 'bg-border/60',
          )} />
        )}
      </div>
      <div className={cn('pb-6 min-w-0 flex-1', isLast && 'pb-0')}>
        <p className={cn(
          'text-sm font-semibold leading-none',
          status === 'done'   ? 'text-foreground/50' :
          status === 'active' ? 'text-foreground/90' :
                                'text-muted-foreground/30',
        )}>
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

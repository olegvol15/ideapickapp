'use client';

import { useEffect, useState } from 'react';
import { Search, BarChart2, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompetitorLogo } from '@/components/market/competitors-list/CompetitorLogo';
import type { Competitor } from '@/types';

type Phase = 'thinking' | 'researching' | 'analyzing';

interface ValidationProgressProps {
  phase: Phase;
  competitors: Competitor[];
  productType: string;
  description: string;
  onCancel: () => void;
}

type StepStatus = 'done' | 'active' | 'pending';

const PHASE_INDEX: Record<Phase, number> = { thinking: 0, researching: 1, analyzing: 2 };
const STEP_INDEX  = ['queries', 'research', 'scoring'] as const;
type StepId = typeof STEP_INDEX[number];

function stepStatus(id: StepId, phase: Phase): StepStatus {
  const pi = PHASE_INDEX[phase];
  const si = STEP_INDEX.indexOf(id);
  if (si < pi)  return 'done';
  if (si === pi) return 'active';
  return 'pending';
}

// Rotate through analysis sub-labels during scoring phase
const SCORING_LABELS = [
  'Computing competition scores…',
  'Weighing pain signals…',
  'Identifying market opportunities…',
  'Running niche comparison…',
  'Finalising validation report…',
];

function useCyclingLabel(active: boolean): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) { setIdx(0); return; }
    const id = setInterval(() => setIdx((i) => (i + 1) % SCORING_LABELS.length), 2800);
    return () => clearInterval(id);
  }, [active]);
  return SCORING_LABELS[idx];
}

// Pulse dot for active steps
function Pulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/40 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground/60" />
    </span>
  );
}

// Step icon area
function StepIcon({ status, Icon }: { status: StepStatus; Icon: React.ElementType }) {
  if (status === 'done')
    return <CheckCircle className="h-4 w-4 text-emerald-500/80 shrink-0" />;
  if (status === 'active')
    return <Icon className="h-4 w-4 text-foreground/70 shrink-0 animate-pulse" />;
  return <Icon className="h-4 w-4 text-muted-foreground/30 shrink-0" />;
}

export function ValidationProgress({
  phase, competitors, productType, description, onCancel,
}: ValidationProgressProps) {
  const scoringLabel  = useCyclingLabel(phase === 'analyzing');
  const isMobile      = productType === 'Mobile App';

  // Derive search keywords shown under the query step
  const searchKeywords: string[] = (() => {
    const base = description.trim().slice(0, 40);
    if (!isMobile) return [`${base} competitors`, `${base} market`, `${base} user problems`];
    return [`${base}`, `${base} alternatives`, `${base} reviews`];
  })();

  const competitorItems = competitors.filter((c) => c.type !== 'signal').slice(0, 5);
  const signalItems     = competitors.filter((c) => c.type === 'signal').slice(0, 4);
  const totalFound      = competitors.length;

  return (
    <div className="mt-8 flex flex-col gap-8">

      {/* Steps */}
      <div className="flex flex-col">

        {/* ── Step 1: Preparing queries ───────────────────────────────── */}
        <Step
          status={stepStatus('queries', phase)}
          icon={Search}
          label="Preparing research queries"
          isLast={false}
        >
          {/* Show keywords once step is done */}
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

        {/* ── Step 2: Researching market ──────────────────────────────── */}
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
                      {c.source && (
                        <span className="text-muted-foreground/35 shrink-0">{c.source}</span>
                      )}
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

        {/* ── Step 3: Scoring & analysis ──────────────────────────────── */}
        <Step
          status={stepStatus('scoring', phase)}
          icon={BarChart2}
          label="Scoring signals & generating report"
          isLast
        >
          {stepStatus('scoring', phase) === 'active' && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/50">
              <Pulse />
              <span>{scoringLabel}</span>
            </div>
          )}
        </Step>
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors w-fit mx-auto"
      >
        Cancel
      </button>
    </div>
  );
}

// ─── Step sub-component ───────────────────────────────────────────────────────

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
      {/* Left rail */}
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

      {/* Content */}
      <div className={cn('pb-6 min-w-0 flex-1', isLast && 'pb-0')}>
        <p className={cn(
          'text-sm font-semibold leading-none',
          status === 'done'    ? 'text-foreground/50' :
          status === 'active'  ? 'text-foreground/90' :
                                 'text-muted-foreground/30',
        )}>
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

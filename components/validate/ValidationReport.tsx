'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, ArrowRight, Copy, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { CompetitorLogo } from '@/components/market/competitors-list/CompetitorLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

interface ValidationReportProps {
  result: EnhancedValidationResult;
  competitors: Competitor[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function scoreColor(n: number): 'emerald' | 'amber' | 'rose' {
  return n >= 70 ? 'emerald' : n >= 45 ? 'amber' : 'rose';
}

function levelColor(level: 'low' | 'medium' | 'high' | undefined): 'emerald' | 'amber' | 'rose' {
  if (level === 'high') return 'emerald';
  if (level === 'medium') return 'amber';
  return 'rose';
}

function colorClass(c: 'emerald' | 'amber' | 'rose', variant: 'text' | 'bg' | 'border') {
  const map = {
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500' },
    amber:   { text: 'text-amber-500',   bg: 'bg-amber-500',   border: 'border-amber-500'   },
    rose:    { text: 'text-rose-500',     bg: 'bg-rose-500',     border: 'border-rose-500'   },
  };
  return map[c][variant];
}

const DECISION_LABEL = { proceed: 'Proceed', 'test-first': 'Test Before Building', drop: 'Drop It' } as const;
const DECISION_COLOR = { proceed: 'emerald', 'test-first': 'amber', drop: 'rose' } as const;
const DECISION_ICON = {
  proceed: CheckCircle,
  'test-first': AlertTriangle,
  drop: XCircle,
} as const;

const DEFAULT_NEXT_STEP: Record<string, string> = {
  proceed: 'Talk to 5 potential users this week — validate the problem before writing code',
  'test-first': 'Post this problem in a relevant community and measure engagement before building',
  drop: 'Document what you learned, then explore a different angle on this problem space',
};

const STEP_LABEL: Record<string, string> = {
  'reddit-post': 'Write Reddit Post',
  'landing-page': 'Build Landing Page',
  interviews: 'Plan Interviews',
  prototype: 'Sketch Prototype',
  survey: 'Create Survey',
  other: 'Take Action',
};

function MiniBar({ value, color }: { value: number; color: 'emerald' | 'amber' | 'rose' }) {
  return (
    <div className="h-1 w-full rounded-full bg-border overflow-hidden">
      <div
        className={cn('h-full rounded-full', colorClass(color, 'bg'))}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function SectionHeading({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p className={cn('text-[10px] font-bold uppercase tracking-widest', color ?? 'text-muted-foreground/50')}>
      {children}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ValidationReport({ result, competitors }: ValidationReportProps) {
  const router = useRouter();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const {
    score,
    painScore,
    competitionScore,
    opportunityScore,
    verdict,
    signals,
    risks,
    confidence,
    confidenceReason,
    keyInsights,
    decision,
    decisionReason,
    nextStep,
    nextStepType,
    validationEffort,
    willingnessToPay,
    evidencedSignals,
    failureReasons,
    marketHardness,
    competitorInsights,
  } = result;

  const mainColor = scoreColor(score);
  const confColor = levelColor(confidence);

  const competitorItems = competitors.filter((c) => c.type !== 'signal').slice(0, 4);
  const signalItems = competitors.filter((c) => c.type === 'signal').slice(0, 3);

  const insightMap = new Map((competitorInsights ?? []).map((ci) => [ci.name.toLowerCase(), ci]));
  function findInsight(c: Competitor) {
    return (
      insightMap.get(c.name.toLowerCase()) ??
      [...insightMap.entries()].find(([k]) =>
        c.name.toLowerCase().includes(k) || k.includes(c.name.toLowerCase().split(' ')[0])
      )?.[1]
    );
  }

  const allEvidence = evidencedSignals && evidencedSignals.length > 0
    ? [...evidencedSignals].sort((a, b) => {
        const r = { strong: 0, moderate: 1, weak: 2 };
        return r[a.strength] - r[b.strength];
      })
    : signals.slice(0, 5).map((s) => ({ text: s, strength: 'moderate' as const }));

  const strongEvidence = allEvidence.filter((s) => s.strength === 'strong');
  const otherEvidence = allEvidence.filter((s) => s.strength !== 'strong');

  async function copyNextStep() {
    if (!nextStep) return;
    try {
      await navigator.clipboard.writeText(nextStep);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  }

  const decisionColor = decision ? DECISION_COLOR[decision] : mainColor;
  const DecisionIcon = decision ? DECISION_ICON[decision] : null;
  const displayNextStep = nextStep ?? (decision ? DEFAULT_NEXT_STEP[decision] : undefined);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {/* ══ ROW 1: Score + Decision | Next Action ═══════════════════════════ */}
      <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">

        {/* Score + Decision */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">

          {/* Score area */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-baseline gap-2">
                <span className={cn('text-5xl font-bold tabular-nums leading-none', colorClass(mainColor, 'text'))}>
                  {score}
                </span>
                <span className="text-base font-semibold text-foreground/70">
                  {score >= 70 ? 'Strong' : score >= 45 ? 'Moderate' : 'Weak'}
                </span>
              </div>
              {confidence && (
                <span className={cn(
                  'text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full',
                  confColor === 'emerald' && 'bg-emerald-500/10 text-emerald-500',
                  confColor === 'amber' && 'bg-amber-500/10 text-amber-500',
                  confColor === 'rose' && 'bg-rose-500/10 text-rose-500',
                )}>
                  {cap(confidence)} confidence
                </span>
              )}
            </div>

            {/* Score bar */}
            <MiniBar value={score} color={mainColor} />

            {/* 1-line verdict — strictly one sentence */}
            {(confidenceReason ?? verdict) && (
              <p className="mt-3 text-xs text-muted-foreground leading-snug line-clamp-1">
                {confidenceReason ?? verdict}
              </p>
            )}

            {/* Key insights */}
            {keyInsights && keyInsights.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {keyInsights.slice(0, 3).map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/75 leading-snug">
                    <span className={cn('mt-[5px] h-1 w-1 shrink-0 rounded-full', colorClass(mainColor, 'bg'))} />
                    {ins}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Decision block — most important element on screen */}
          <div className={cn(
            'mt-auto border-t border-border px-5 py-5',
            decisionColor === 'emerald' && 'bg-emerald-500/[0.07]',
            decisionColor === 'amber' && 'bg-amber-500/[0.07]',
            decisionColor === 'rose' && 'bg-rose-500/[0.07]',
          )}>
            <SectionHeading>You should</SectionHeading>
            {decision ? (
              <>
                <div className="mt-2 flex items-center gap-2.5">
                  {DecisionIcon && (
                    <DecisionIcon className={cn('h-5 w-5 shrink-0', colorClass(decisionColor, 'text'))} />
                  )}
                  <p className={cn('text-3xl font-bold tracking-tight leading-none', colorClass(decisionColor, 'text'))}>
                    {DECISION_LABEL[decision]}
                  </p>
                </div>
                {decisionReason && (
                  <p className="mt-2.5 text-xs leading-relaxed text-foreground/60 line-clamp-2">{decisionReason}</p>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{verdict}</p>
            )}
          </div>
        </div>

        {/* Next Action */}
        <div className="flex flex-col rounded-xl border border-border bg-card px-5 py-5 gap-4">
          <div className="flex-1">
            <SectionHeading>Next Step</SectionHeading>
            <p className="mt-2 text-sm font-semibold text-foreground leading-snug">
              {displayNextStep}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {nextStepType && STEP_LABEL[nextStepType] && (
              <Button size="sm" className="w-full justify-between">
                {STEP_LABEL[nextStepType]}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={copyNextStep}>
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <Button size="sm" className="flex-1" variant="outline" onClick={() => router.push('/research')}>
                Start Building
              </Button>
            </div>
          </div>

          {/* Validation effort — compact, tucked at bottom */}
          {validationEffort && (
            <div className="border-t border-border pt-3 grid grid-cols-3 gap-1 text-center">
              {[
                { k: 'Time', v: validationEffort.time },
                { k: 'Cost', v: validationEffort.cost },
                { k: 'Level', v: cap(validationEffort.difficulty) },
              ].map(({ k, v }) => (
                <div key={k}>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">{k}</p>
                  <p className="text-[11px] font-semibold text-foreground/70 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ ROW 2: Metrics ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border overflow-hidden bg-card">
        {[
          { label: 'Pain', value: painScore },
          { label: 'Competition', value: competitionScore },
          { label: 'Opportunity', value: opportunityScore },
        ].map(({ label, value }) => {
          const c = scoreColor(value);
          return (
            <div key={label} className="flex flex-col gap-1.5 px-4 py-2.5">
              <SectionHeading>{label}</SectionHeading>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold tabular-nums text-foreground/75">{value}</span>
                <div className="flex-1">
                  <MiniBar value={value} color={c} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ ROW 3: Competitors | Risks ═══════════════════════════════════════ */}
      <div className="grid gap-3 sm:grid-cols-2">

        {/* Competitors */}
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="mb-3">
            <SectionHeading>Competitors</SectionHeading>
            {marketHardness && (
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{marketHardness}</p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {competitorItems.length > 0 ? competitorItems.map((c) => {
              const ins = findInsight(c);
              return (
                <div key={c.url} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <CompetitorLogo domain={c.source} name={c.name} />
                    <span className="text-sm font-semibold text-foreground truncate flex-1">{c.name}</span>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  {ins ? (
                    <div className="pl-[26px] flex flex-col gap-0.5">
                      <p className="text-[11px] text-foreground/55 leading-snug">
                        <span className="text-emerald-500/70 font-medium">↳ </span>{ins.whyChosen}
                      </p>
                      <p className="text-[11px] text-foreground/55 leading-snug">
                        <span className="text-rose-500/70 font-medium">✕ </span>{ins.weakness}
                      </p>
                    </div>
                  ) : c.snippet ? (
                    <p className="pl-[26px] text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {c.snippet}
                    </p>
                  ) : null}
                </div>
              );
            }) : (
              <p className="text-xs text-muted-foreground">No competitor data available.</p>
            )}
          </div>
        </div>

        {/* Risks */}
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionHeading color="text-rose-500/60">Why This Could Fail</SectionHeading>
          <ul className="mt-3 flex flex-col gap-2">
            {(failureReasons ?? risks).slice(0, 5).map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/70 leading-snug">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-rose-500/60" />
                {r}
              </li>
            ))}
          </ul>

          {/* Market Reality — tucked at bottom of Risks */}
          {willingnessToPay && (
            <div className="mt-4 border-t border-border pt-3 flex flex-col gap-1.5">
              <SectionHeading>Market Reality</SectionHeading>
              <div className="mt-1 flex flex-col gap-1">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground/60">Willingness to pay</span>
                  <span className={cn(
                    'text-[11px] font-semibold',
                    levelColor(willingnessToPay.level) === 'emerald' && 'text-emerald-500',
                    levelColor(willingnessToPay.level) === 'amber' && 'text-amber-500',
                    levelColor(willingnessToPay.level) === 'rose' && 'text-rose-500',
                  )}>
                    {cap(willingnessToPay.level)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 leading-snug">
                  {willingnessToPay.freeSubstitutes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ ROW 4: Evidence (collapsible) ════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setEvidenceOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <SectionHeading>Evidence</SectionHeading>
            <span className="text-[10px] text-muted-foreground/40 -mt-[2px]">
              {allEvidence.length + signalItems.length} sources
            </span>
          </div>
          {evidenceOpen
            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50" />
            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
          }
        </button>

        {evidenceOpen && (
          <div className="border-t border-border px-5 pb-5 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Strong */}
              {strongEvidence.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70 mb-2">
                    Strong
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {strongEvidence.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/75 leading-snug">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                        {s.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Moderate + Weak + Web signals */}
              <div>
                {otherEvidence.length > 0 && (
                  <>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
                      Moderate / Weak
                    </p>
                    <ul className="flex flex-col gap-1.5 mb-3">
                      {otherEvidence.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground/55 leading-snug">
                          <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                          {s.text}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {signalItems.length > 0 && (
                  <>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
                      Web Sources
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {signalItems.map((c) => (
                        <li key={c.url} className="flex items-center gap-1.5">
                          <CompetitorLogo domain={c.source} name={c.name} />
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors leading-snug truncate"
                          >
                            {c.name}
                          </a>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0 text-muted-foreground/30" />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

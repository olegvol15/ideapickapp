'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExternalLink, ArrowRight, Copy, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, XCircle, Target,
} from 'lucide-react';
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
  return n >= 70 ? 'emerald' : n >= 40 ? 'amber' : 'rose';
}

function colorClass(c: 'emerald' | 'amber' | 'rose', variant: 'text' | 'bg' | 'border') {
  const map = {
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500' },
    amber:   { text: 'text-amber-500',   bg: 'bg-amber-500',   border: 'border-amber-500'   },
    rose:    { text: 'text-rose-500',     bg: 'bg-rose-500',    border: 'border-rose-500'    },
  };
  return map[c][variant];
}

function tintClass(c: 'emerald' | 'amber' | 'rose') {
  return {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber:   'bg-amber-500/10 text-amber-400',
    rose:    'bg-rose-500/10 text-rose-400',
  }[c];
}

function getLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function metricTone(level: 'LOW' | 'MEDIUM' | 'HIGH', invert: boolean): 'emerald' | 'amber' | 'rose' {
  if (invert) {
    return level === 'HIGH' ? 'rose' : level === 'MEDIUM' ? 'amber' : 'emerald';
  }
  return level === 'HIGH' ? 'emerald' : level === 'MEDIUM' ? 'amber' : 'rose';
}

const VERDICT_LABEL = { proceed: 'BUILD', 'test-first': 'RISKY', drop: 'DO NOT BUILD' } as const;
const DECISION_COLOR = { proceed: 'emerald', 'test-first': 'amber', drop: 'rose' } as const;
const DECISION_ICON = { proceed: CheckCircle, 'test-first': AlertTriangle, drop: XCircle } as const;

const DEFAULT_NEXT_STEP: Record<string, string> = {
  proceed: 'Talk to 5 potential users this week — validate the problem before writing code',
  'test-first': 'Post this problem in a relevant community and measure engagement before building',
  drop: 'Pivot to a narrower segment or a problem space with weaker existing competition',
};

const VALIDATION_STEP_TYPES = new Set(['reddit-post', 'landing-page', 'interviews', 'survey']);

const STEP_LABEL: Record<string, string> = {
  'reddit-post': 'Write Reddit Post',
  'landing-page': 'Build Landing Page',
  interviews: 'Plan Interviews',
  prototype: 'Sketch Prototype',
  survey: 'Create Survey',
  other: 'Take Action',
};

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionHeading({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p className={cn('text-[10px] font-bold uppercase tracking-widest', color ?? 'text-muted-foreground/70')}>
      {children}
    </p>
  );
}

// ─── MetricBar ────────────────────────────────────────────────────────────────

interface MetricBarProps {
  label: string;
  score: number;
  invert?: boolean;
}

function MetricBar({ label, score, invert = false }: MetricBarProps) {
  const level = getLevel(score);
  const tone = metricTone(level, invert);
  const width = `${Math.max(0, Math.min(100, score))}%`;

  return (
    <div className="grid grid-cols-[110px_80px_minmax(0,1fr)_36px] items-center gap-3">
      <span className="text-sm font-semibold text-foreground/85">{label}</span>
      <span className={cn('text-xs font-bold tracking-wider', colorClass(tone, 'text'))}>
        {level}
      </span>
      <div className="h-2 overflow-hidden rounded-full bg-border/80">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', colorClass(tone, 'bg'))}
          style={{ width }}
        />
      </div>
      <span className={cn('text-right text-xs font-semibold tabular-nums', colorClass(tone, 'text'))}>
        {score}
      </span>
    </div>
  );
}

// ─── ScoreBreakdownRow (advanced) ────────────────────────────────────────────

function ScoreBreakdownRow({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'rose' }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)_40px] items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/65 leading-tight">
        {label}
      </span>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', colorClass(tone, 'bg'))}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className={cn('text-right text-xs font-semibold tabular-nums', colorClass(tone, 'text'))}>
        {value}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ValidationReport({ result, competitors }: ValidationReportProps) {
  const router = useRouter();
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
    decision,
    decisionReason,
    nextStep,
    nextStepType,
    validationEffort,
    scoreBreakdown,
    evidencedSignals,
    failureReasons,
    marketHardness,
    competitorInsights,
    whereToWin,
    willingnessToPay,
    keyInsights,
  } = result;

  const isDrop    = decision === 'drop';
  const isProceed = decision === 'proceed';
  const isTest    = decision === 'test-first';

  const decisionKey = decision ?? (score >= 70 ? 'proceed' : score >= 40 ? 'test-first' : 'drop');
  const decisionColor = DECISION_COLOR[decisionKey] ?? scoreColor(score);
  const DecisionIcon  = DECISION_ICON[decisionKey] ?? null;
  const verdictLabel  = VERDICT_LABEL[decisionKey] ?? 'REVIEW';

  // Top-block bullet reasons: prefer keyInsights, then fallback by decision type
  const reasonBullets: string[] = (() => {
    if (keyInsights && keyInsights.length > 0) return keyInsights.slice(0, 3);
    if (isDrop) return (failureReasons ?? risks).slice(0, 3);
    if (isProceed) return signals.slice(0, 3);
    return [...signals.slice(0, 2), ...(failureReasons ?? risks).slice(0, 1)];
  })();

  // "Why this decision" bullets (more detailed, from failure reasons + risks)
  const whyBullets: string[] = (() => {
    const base = failureReasons && failureReasons.length > 0 ? failureReasons : risks;
    if (keyInsights && keyInsights.length > 0) {
      // Use keyInsights not already shown in top block
      const extra = keyInsights.slice(3);
      return [...base.slice(0, 3), ...extra.slice(0, 2)].slice(0, 5);
    }
    return base.slice(0, 5);
  })();

  const displayNextStep = nextStep ?? (decision ? DEFAULT_NEXT_STEP[decision] : undefined);

  const competitorItems = competitors.filter((c) => c.type !== 'signal').slice(0, 5);
  const signalItems     = competitors.filter((c) => c.type === 'signal').slice(0, 4);

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

  const showPrimaryAction =
    !isDrop &&
    !!nextStepType &&
    !!STEP_LABEL[nextStepType] &&
    (isProceed ? true : isTest ? VALIDATION_STEP_TYPES.has(nextStepType) : true);

  const showStartBuilding = isProceed || !decision;

  async function copyNextStep() {
    if (!nextStep) return;
    try {
      await navigator.clipboard.writeText(nextStep);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  }

  const compInterp = competitionScore >= 70 ? 'High competition' : competitionScore >= 40 ? 'Moderate competition' : 'Low competition';
  const compColor: 'emerald' | 'amber' | 'rose' = competitionScore >= 70 ? 'rose' : competitionScore >= 40 ? 'amber' : 'emerald';
  const painInterp = painScore >= 70 ? 'High demand' : painScore >= 40 ? 'Moderate demand' : 'Low demand';
  const oppInterp  = opportunityScore >= 70 ? 'Strong opportunity' : opportunityScore >= 40 ? 'Moderate opportunity' : 'Weak opportunity';

  const detailedBreakdown = scoreBreakdown?.pain && scoreBreakdown?.competition && scoreBreakdown?.opportunity
    ? [
        { title: 'Pain',        total: painScore,        interpretation: painInterp, tone: scoreColor(painScore),        items: scoreBreakdown.pain },
        { title: 'Competition', total: competitionScore, interpretation: compInterp, tone: compColor,                    items: scoreBreakdown.competition },
        { title: 'Opportunity', total: opportunityScore, interpretation: oppInterp,  tone: scoreColor(opportunityScore), items: scoreBreakdown.opportunity },
      ]
    : null;

  const hasAdvanced = !!(
    competitorItems.length > 0 ||
    signalItems.length > 0 ||
    detailedBreakdown ||
    willingnessToPay ||
    allEvidence.length > 0
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ══ SECTION 1: VERDICT (decision-first) ════════════════════════════════ */}
      <div className={cn(
        'rounded-xl border px-6 py-6',
        decisionColor === 'emerald' && 'border-emerald-500/25 bg-emerald-500/[0.05]',
        decisionColor === 'amber'   && 'border-amber-500/25 bg-amber-500/[0.05]',
        decisionColor === 'rose'    && 'border-rose-500/25 bg-rose-500/[0.05]',
      )}>
        {/* Verdict label + score */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {DecisionIcon && (
              <DecisionIcon className={cn('h-7 w-7 shrink-0 mt-0.5', colorClass(decisionColor, 'text'))} />
            )}
            <span className={cn('text-4xl font-black tracking-tight leading-none', colorClass(decisionColor, 'text'))}>
              {verdictLabel}
            </span>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className={cn('text-5xl font-black tabular-nums leading-none', colorClass(decisionColor, 'text'))}>
              {score}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">
              Score
            </span>
          </div>
        </div>

        {/* Confidence */}
        {confidence && (
          <p className="mt-3 text-sm text-muted-foreground/70">
            Confidence:{' '}
            <span className={cn('font-semibold', colorClass(
              confidence === 'high' ? 'emerald' : confidence === 'medium' ? 'amber' : 'rose',
              'text'
            ))}>
              {cap(confidence)}
            </span>
            {confidenceReason && (
              <span className="text-muted-foreground/50"> — {confidenceReason}</span>
            )}
          </p>
        )}

        {/* Reason bullets */}
        {reasonBullets.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {reasonBullets.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-snug">
                <span className={cn('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full', colorClass(decisionColor, 'bg'))} />
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ══ SECTION 2: 3 CORE METRICS ══════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <SectionHeading>Market signals</SectionHeading>
        <div className="mt-4 flex flex-col gap-4">
          <MetricBar label="Competition"  score={competitionScore}  invert />
          <MetricBar label="Demand"       score={painScore} />
          <MetricBar label="Opportunity"  score={opportunityScore} />
        </div>
      </div>

      {/* ══ SECTION 3: WHY + WHERE (always visible) ═════════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Why this decision */}
        <div className="rounded-xl border border-border bg-card px-5 py-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <SectionHeading color="text-rose-400">Why this decision</SectionHeading>
          </div>
          {whyBullets.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {whyBullets.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-snug">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/70" />
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{decisionReason ?? verdict}</p>
          )}
          {marketHardness && (
            <p className="mt-4 text-xs text-muted-foreground/65 italic leading-snug border-t border-border pt-3">
              {marketHardness}
            </p>
          )}
        </div>

        {/* Where you could win */}
        <div className={cn(
          'rounded-xl border px-5 py-5',
          isDrop ? 'border-amber-500/20 bg-amber-500/[0.03]' : 'border-emerald-500/20 bg-emerald-500/[0.03]',
        )}>
          <div className="flex items-center gap-2 mb-4">
            {isDrop
              ? <XCircle className="h-4 w-4 text-amber-400/80 shrink-0" />
              : <Target className="h-4 w-4 text-emerald-400 shrink-0" />
            }
            <SectionHeading color={isDrop ? 'text-amber-400/80' : 'text-emerald-400'}>
              {isDrop ? 'Possible pivots' : isProceed ? 'Your edge' : 'Where you could win'}
            </SectionHeading>
          </div>
          {whereToWin && whereToWin.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {whereToWin.slice(0, 4).map((insight, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <span className={cn(
                    'inline-flex w-fit text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                    isDrop ? 'bg-amber-500/10 text-amber-400/80' : 'bg-emerald-500/10 text-emerald-400',
                  )}>
                    {insight.title}
                  </span>
                  <p className={cn(
                    'text-sm leading-snug',
                    isDrop ? 'text-foreground/60' : isProceed ? 'text-foreground/90 font-semibold' : 'text-foreground/80',
                  )}>
                    {insight.opportunity}
                  </p>
                </li>
              ))}
            </ul>
          ) : signals.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {signals.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/75 leading-snug">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground/60">No clear angle identified.</p>
          )}
        </div>
      </div>

      {/* ══ SECTION 4: YOUR MOVE ════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card px-6 py-5 flex flex-col gap-4">
        <div>
          <SectionHeading>Your move</SectionHeading>
          <p className="mt-2 text-sm font-semibold text-foreground leading-snug">
            {displayNextStep}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {isDrop ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => router.push('/validate')}
            >
              Try Another Angle
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <>
              {showPrimaryAction && (
                <Button size="sm" className="w-full justify-between">
                  {STEP_LABEL[nextStepType!]}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={copyNextStep}>
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
                {showStartBuilding && (
                  <Button size="sm" className="flex-1" variant="outline" onClick={() => router.push('/research')}>
                    Start Building
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {validationEffort && !isDrop && (
          <div className="border-t border-border pt-3 grid grid-cols-3 gap-1 text-center">
            {[
              { k: 'Time',  v: validationEffort.time },
              { k: 'Cost',  v: validationEffort.cost },
              { k: 'Level', v: cap(validationEffort.difficulty) },
            ].map(({ k, v }) => (
              <div key={k}>
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">{k}</p>
                <p className="text-[11px] font-semibold text-foreground/85 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ SECTION 5: ADVANCED ANALYSIS (collapsed) ═══════════════════════════ */}
      {hasAdvanced && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <SectionHeading>Advanced analysis</SectionHeading>
              <span className="text-xs text-muted-foreground/50 -mt-[2px]">
                competitors · breakdown · evidence
              </span>
            </div>
            {advancedOpen
              ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
            }
          </button>

          {advancedOpen && (
            <div className="border-t border-border px-6 pb-6 pt-6 flex flex-col gap-6">

              {/* Competitors */}
              {competitorItems.length > 0 && (
                <div className="flex flex-col gap-4">
                  <SectionHeading>Competitors</SectionHeading>
                  <div className="flex flex-col gap-4">
                    {competitorItems.map((c) => {
                      const ins = findInsight(c);
                      return (
                        <div key={c.url} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <CompetitorLogo domain={c.source} name={c.name} />
                            <span className="text-sm font-semibold text-foreground truncate flex-1">{c.name}</span>
                            {c.platform && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/70">
                                {c.platform}
                              </span>
                            )}
                            {c.rating != null && (
                              <span className="text-[10px] font-medium text-amber-400/80">
                                ★ {c.rating.toFixed(1)}{c.reviewCount ? ` (${c.reviewCount.toLocaleString()})` : ''}
                              </span>
                            )}
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground/60 hover:text-foreground bg-muted/30 hover:bg-muted/60 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Visit
                            </a>
                          </div>
                          {ins ? (
                            <div className="pl-[26px] flex flex-col gap-1">
                              <p className="text-xs text-foreground/75 leading-snug">
                                <span className="text-emerald-500/80 font-medium">↳ </span>{ins.whyChosen}
                              </p>
                              <p className="text-xs text-foreground/75 leading-snug">
                                <span className="text-rose-500/80 font-medium">✕ </span>{ins.weakness}
                              </p>
                            </div>
                          ) : c.snippet ? (
                            <p className="pl-[26px] text-xs text-muted-foreground/80 leading-snug line-clamp-2">
                              {c.snippet}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detailed score breakdown */}
              {detailedBreakdown && (
                <div className={cn('flex flex-col gap-5', competitorItems.length > 0 && 'border-t border-border pt-5')}>
                  <SectionHeading>Score breakdown</SectionHeading>
                  {detailedBreakdown.map((group) => (
                    <div key={group.title} className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 w-24">
                          {group.title}
                        </span>
                        <span className={cn('text-xs font-semibold tabular-nums', colorClass(group.tone, 'text'))}>
                          {group.total}
                        </span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', tintClass(group.tone))}>
                          {group.interpretation}
                        </span>
                      </div>
                      <div className="ml-2 flex flex-col gap-2">
                        {group.items.map((item) => (
                          <ScoreBreakdownRow
                            key={`${group.title}-${item.label}`}
                            label={item.label}
                            value={item.score}
                            tone={group.tone}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Willingness to Pay */}
              {willingnessToPay && (
                <div className="border-t border-border pt-5 flex flex-col gap-3">
                  <SectionHeading>Willingness to Pay</SectionHeading>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-2xl font-bold tabular-nums leading-none',
                      willingnessToPay.level === 'high'   && 'text-emerald-500',
                      willingnessToPay.level === 'medium' && 'text-amber-500',
                      willingnessToPay.level === 'low'    && 'text-rose-500',
                    )}>
                      {cap(willingnessToPay.level)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {willingnessToPay.freeSubstitutes && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Free alternatives</span>
                        <span className="text-sm text-foreground/75 leading-snug">{willingnessToPay.freeSubstitutes}</span>
                      </div>
                    )}
                    {willingnessToPay.paidAlternatives && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Paid alternatives</span>
                        <span className="text-sm text-foreground/75 leading-snug">{willingnessToPay.paidAlternatives}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Evidenced signals + web sources */}
              {(allEvidence.length > 0 || signalItems.length > 0) && (
                <div className="border-t border-border pt-5 grid gap-5 sm:grid-cols-2">
                  {allEvidence.length > 0 && (
                    <div>
                      <SectionHeading>Evidence signals</SectionHeading>
                      <ul className="mt-3 flex flex-col gap-2">
                        {allEvidence.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-snug">
                            <span className={cn(
                              'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full',
                              s.strength === 'strong' ? 'bg-emerald-500' : s.strength === 'moderate' ? 'bg-amber-500/70' : 'bg-muted-foreground/50'
                            )} />
                            {s.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {signalItems.length > 0 && (
                    <div>
                      <SectionHeading>Web sources</SectionHeading>
                      <ul className="mt-3 flex flex-col gap-2">
                        {signalItems.map((c) => (
                          <li key={c.url} className="flex items-center gap-2">
                            <CompetitorLogo domain={c.source} name={c.name} />
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground/80 hover:text-muted-foreground transition-colors leading-snug truncate"
                            >
                              {c.name}
                            </a>
                            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}

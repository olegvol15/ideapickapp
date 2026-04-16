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
    rose:    { text: 'text-rose-500',     bg: 'bg-rose-500',    border: 'border-rose-500'    },
  };
  return map[c][variant];
}

const DECISION_LABEL = { proceed: 'Proceed', 'test-first': 'Test Before Building', drop: 'Drop This Idea' } as const;
const DECISION_COLOR = { proceed: 'emerald', 'test-first': 'amber', drop: 'rose' } as const;
const DECISION_ICON = { proceed: CheckCircle, 'test-first': AlertTriangle, drop: XCircle } as const;

const DEFAULT_NEXT_STEP: Record<string, string> = {
  proceed: 'Talk to 5 potential users this week — validate the problem before writing code',
  'test-first': 'Post this problem in a relevant community and measure engagement before building',
  drop: 'Pivot to a narrower segment or a problem space with weaker existing competition',
};

const VALIDATION_STEP_TYPES = new Set(['reddit-post', 'landing-page', 'interviews', 'survey']);
const BUILD_STEP_TYPES = new Set(['prototype', 'other']);

const STEP_LABEL: Record<string, string> = {
  'reddit-post': 'Write Reddit Post',
  'landing-page': 'Build Landing Page',
  interviews: 'Plan Interviews',
  prototype: 'Sketch Prototype',
  survey: 'Create Survey',
  other: 'Take Action',
};

function SectionHeading({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p className={cn('text-[10px] font-bold uppercase tracking-widest', color ?? 'text-muted-foreground/70')}>
      {children}
    </p>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  interpretation: string;
  color: 'emerald' | 'amber' | 'rose';
}

function StatTile({ label, value, interpretation, color }: StatTileProps) {
  return (
    <div className="relative flex flex-col gap-1 overflow-hidden rounded-lg border border-border bg-card/50 px-4 py-3">
      <SectionHeading>{label}</SectionHeading>
      <span className={cn('text-2xl font-bold tabular-nums leading-none', colorClass(color, 'text'))}>
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground/75 leading-snug">{interpretation}</span>
      <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', colorClass(color, 'bg'))} />
    </div>
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
    decision,
    decisionReason,
    nextStep,
    nextStepType,
    validationEffort,
    evidencedSignals,
    failureReasons,
    marketHardness,
    competitorInsights,
    whereToWin,
    willingnessToPay,
    keyInsights,
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

  const isDrop = decision === 'drop';
  const isProceed = decision === 'proceed';
  const isTest = decision === 'test-first';

  const WinIcon = isDrop ? XCircle : Target;
  const winSection = {
    heading:         isDrop ? 'NOT ENOUGH TO WIN' : isProceed ? 'YOUR EDGE' : 'WHERE YOU CAN WIN',
    headingColor:    isDrop ? 'text-amber-400/80'  : 'text-emerald-400',
    iconColor:       isDrop ? 'text-amber-400/80'  : 'text-emerald-400',
    borderTop:       isDrop ? 'border-amber-500/15' : 'border-emerald-500/20',
    divider:         isDrop ? 'divide-amber-500/10' : 'divide-emerald-500/10',
    badge:           isDrop ? 'bg-amber-500/10 text-amber-400/80' : 'bg-emerald-500/10 text-emerald-400',
    openingLabel:    isDrop ? 'Angle'       : isProceed ? 'Your edge' : 'Opening',
    openingLabelCls: isDrop ? 'text-amber-400/70' : 'text-emerald-400',
    openingValueCls: isDrop
      ? 'text-foreground/50'
      : isProceed
      ? 'text-foreground/95 font-bold'
      : 'text-foreground/90 font-semibold',
  };

  const showPrimaryAction =
    !isDrop &&
    !!nextStepType &&
    !!STEP_LABEL[nextStepType] &&
    (isProceed ? true : isTest ? VALIDATION_STEP_TYPES.has(nextStepType) : true);

  const showStartBuilding = isProceed || !decision;

  // Stat tile interpretations
  const painInterp = painScore >= 70 ? 'High demand' : painScore >= 45 ? 'Moderate demand' : 'Low demand';
  const compInterp = competitionScore >= 70 ? 'High competition' : competitionScore >= 45 ? 'Moderate competition' : 'Low competition';
  const compColor: 'emerald' | 'amber' | 'rose' = competitionScore >= 70 ? 'rose' : competitionScore >= 45 ? 'amber' : 'emerald';
  const oppInterp = opportunityScore >= 70 ? 'Strong opportunity' : opportunityScore >= 45 ? 'Moderate opportunity' : 'Weak opportunity';
  const scoreInterp = score >= 70 ? 'Strong' : score >= 45 ? 'Moderate' : 'Weak';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ══ SECTION 1: VERDICT ═══════════════════════════════════════════════ */}
      <div className={cn(
        'rounded-xl border px-6 py-6',
        decisionColor === 'emerald' && 'border-emerald-500/25 bg-emerald-500/[0.05]',
        decisionColor === 'amber'   && 'border-amber-500/25 bg-amber-500/[0.05]',
        decisionColor === 'rose'    && 'border-rose-500/25 bg-rose-500/[0.05]',
      )}>
        {/* Decision hero */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {DecisionIcon && (
            <DecisionIcon className={cn('h-6 w-6 shrink-0', colorClass(decisionColor, 'text'))} />
          )}
          <h2 className={cn('text-3xl font-bold tracking-tight leading-none', colorClass(decisionColor, 'text'))}>
            {decision ? DECISION_LABEL[decision] : (score >= 70 ? 'Proceed' : score >= 45 ? 'Test First' : 'Reconsider')}
          </h2>
          {confidence && (
            <span className={cn(
              'text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full',
              confColor === 'emerald' && 'bg-emerald-500/10 text-emerald-500',
              confColor === 'amber'   && 'bg-amber-500/10 text-amber-500',
              confColor === 'rose'    && 'bg-rose-500/10 text-rose-500',
            )}>
              {cap(confidence)} confidence
            </span>
          )}
        </div>
        <p className="text-sm text-foreground/60 leading-relaxed">
          {decisionReason ?? confidenceReason ?? verdict}
        </p>

        {/* Metric tiles */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Score"
            value={score}
            interpretation={scoreInterp}
            color={mainColor}
          />
          <StatTile
            label="Pain"
            value={painScore}
            interpretation={painInterp}
            color={scoreColor(painScore)}
          />
          <StatTile
            label="Competition"
            value={competitionScore}
            interpretation={compInterp}
            color={compColor}
          />
          <StatTile
            label="Opportunity"
            value={opportunityScore}
            interpretation={oppInterp}
            color={scoreColor(opportunityScore)}
          />
        </div>
      </div>

      {/* ══ SECTION 2: EVIDENCE (collapsible) ═══════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setEvidenceOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <SectionHeading>Evidence</SectionHeading>
            <span className="text-xs text-muted-foreground/60 -mt-[2px]">
              {allEvidence.length + signalItems.length} sources
            </span>
          </div>
          {evidenceOpen
            ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
          }
        </button>

        {evidenceOpen && (
          <div className="border-t border-border px-6 pb-6 pt-6 flex flex-col gap-6">

            {/* 2-col: Competitors | Risks + Where You Can Win */}
            <div className="grid gap-6 sm:grid-cols-2">

              {/* Competitors */}
              <div className="flex flex-col gap-4">
                <div>
                  <SectionHeading>Competitors</SectionHeading>
                  {marketHardness && (
                    <p className="mt-1.5 text-xs text-muted-foreground leading-snug">{marketHardness}</p>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  {competitorItems.length > 0 ? competitorItems.map((c) => {
                    const ins = findInsight(c);
                    return (
                      <div key={c.url} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <CompetitorLogo domain={c.source} name={c.name} />
                          <span className="text-sm font-semibold text-foreground truncate flex-1">{c.name}</span>
                          {/* Platform / rating chips */}
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
                        {c.pricingSignal && (
                          <p className="pl-[26px] text-xs text-muted-foreground/65 leading-snug italic">
                            {c.pricingSignal}
                          </p>
                        )}
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-muted-foreground">No competitor data available.</p>
                  )}
                </div>
              </div>

              {/* Risks + Where You Can Win */}
              <div className="flex flex-col gap-5">
                {/* Why This Could Fail */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    <SectionHeading color="text-rose-400">Why This Could Fail</SectionHeading>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {(failureReasons ?? risks).slice(0, 5).map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-snug">
                        <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/70" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Where You Can Win */}
                {whereToWin && whereToWin.length > 0 && (
                  <div className={cn('border-t pt-5', winSection.borderTop)}>
                    <div className="flex items-center gap-2 mb-4">
                      <WinIcon className={cn('h-4 w-4 shrink-0', winSection.iconColor)} />
                      <SectionHeading color={winSection.headingColor}>{winSection.heading}</SectionHeading>
                    </div>
                    <div className={cn('flex flex-col divide-y', winSection.divider)}>
                      {whereToWin.map((insight, i) => (
                        <div key={i} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2.5">
                          <span className={cn('inline-flex w-fit text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded', winSection.badge)}>
                            {insight.title}
                          </span>
                          <div className="flex flex-col gap-1.5">
                            <div className="grid grid-cols-[72px_1fr] gap-2.5 items-start">
                              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50 pt-px">They do</span>
                              <span className="text-sm text-foreground/70 leading-snug">{insight.pattern}</span>
                            </div>
                            <div className="grid grid-cols-[72px_1fr] gap-2.5 items-start">
                              <span className="text-xs font-semibold uppercase tracking-wide text-rose-400/90 pt-px">Ignore</span>
                              <span className="text-sm text-foreground/80 leading-snug">{insight.gap}</span>
                            </div>
                            <div className="grid grid-cols-[72px_1fr] gap-2.5 items-start">
                              <span className={cn('text-xs font-semibold uppercase tracking-wide pt-px', winSection.openingLabelCls)}>
                                {winSection.openingLabel}
                              </span>
                              <span className={cn('text-sm leading-snug', winSection.openingValueCls)}>
                                {insight.opportunity}
                              </span>
                            </div>
                            {isDrop && (
                              <div className="grid grid-cols-[72px_1fr] gap-2.5 items-start">
                                <span className="text-xs font-semibold uppercase tracking-wide text-rose-400/80 pt-px">But →</span>
                                <span className="text-sm text-foreground/60 leading-snug italic">
                                  Not sufficient to overcome established players in this market
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Willingness to Pay + Key Insights */}
            {(willingnessToPay || (keyInsights && keyInsights.length > 0)) && (
              <div className="border-t border-border pt-5 grid gap-5 sm:grid-cols-2">
                {willingnessToPay && (
                  <div className="flex flex-col gap-3">
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
                {keyInsights && keyInsights.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <SectionHeading>Key Insights</SectionHeading>
                    <ul className="flex flex-col gap-2.5">
                      {keyInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-snug">
                          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Full-width: Evidenced signals */}
            {(strongEvidence.length > 0 || otherEvidence.length > 0 || signalItems.length > 0) && (
              <div className="border-t border-border pt-5 grid gap-5 sm:grid-cols-2">
                {strongEvidence.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/90 mb-2.5">Strong</p>
                    <ul className="flex flex-col gap-2">
                      {strongEvidence.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85 leading-snug">
                          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {s.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  {otherEvidence.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/65 mb-2.5">Moderate / Weak</p>
                      <ul className="flex flex-col gap-2 mb-4">
                        {otherEvidence.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/75 leading-snug">
                            <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                            {s.text}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {signalItems.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/65 mb-2.5">Web Sources</p>
                      <ul className="flex flex-col gap-2">
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
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ SECTION 3: YOUR MOVE ═════════════════════════════════════════════ */}
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
              { k: 'Time', v: validationEffort.time },
              { k: 'Cost', v: validationEffort.cost },
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

    </div>
  );
}

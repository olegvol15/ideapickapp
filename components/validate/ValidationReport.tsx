'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExternalLink, ArrowRight, Copy, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, XCircle, Target, TrendingDown,
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

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function pct(n: number)  { return `${Math.round(n * 100)}%`; }

function scoreColor(n: number): Tone { return n >= 70 ? 'emerald' : n >= 40 ? 'amber' : 'rose'; }
function getLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  return score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
}
function metricTone(level: 'LOW' | 'MEDIUM' | 'HIGH', invert: boolean): Tone {
  if (invert) return level === 'HIGH' ? 'rose' : level === 'MEDIUM' ? 'amber' : 'emerald';
  return level === 'HIGH' ? 'emerald' : level === 'MEDIUM' ? 'amber' : 'rose';
}

type Tone = 'emerald' | 'amber' | 'rose';
function colorClass(c: Tone, v: 'text' | 'bg' | 'border') {
  return ({ emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500' },
            amber:   { text: 'text-amber-500',   bg: 'bg-amber-500',   border: 'border-amber-500'   },
            rose:    { text: 'text-rose-500',     bg: 'bg-rose-500',    border: 'border-rose-500'    } })[c][v];
}

// ─── Level 1: market reality (primary verdict) ────────────────────────────────

interface VerdictConfig { label: string; color: Tone; Icon: React.ElementType; }

function getMarketReality(result: EnhancedValidationResult): VerdictConfig {
  const locked    = result.metrics?.marketLocked ?? false;
  const dominance = result.metrics?.marketDominance;
  const comp      = result.rawScores?.competitionScore ?? 0; // 0–10
  if (locked)                                   return { label: 'MARKET IS LOCKED',          color: 'rose',    Icon: XCircle       };
  if (dominance === 'HIGH' || comp >= 7)        return { label: 'HIGHLY COMPETITIVE MARKET', color: 'rose',    Icon: XCircle       };
  if (comp >= 5  || dominance === 'MEDIUM')     return { label: 'MODERATELY COMPETITIVE',    color: 'amber',   Icon: AlertTriangle };
  if (comp >= 3)                                return { label: 'SOME COMPETITION',           color: 'amber',   Icon: AlertTriangle };
  return                                               { label: 'OPEN MARKET',               color: 'emerald', Icon: CheckCircle   };
}

// ─── Level 2: entry possibility (secondary verdict) ───────────────────────────

interface EntryConfig extends VerdictConfig { show: boolean; }

function getEntryPossibility(result: EnhancedValidationResult): EntryConfig {
  const { decision, bestEntryStrategy } = result;
  if (bestEntryStrategy === 'NO_VIABLE_ENTRY')  return { label: 'No viable entry found',         color: 'rose',    Icon: XCircle,       show: true  };
  if (bestEntryStrategy === 'ENTER_VIA_NICHE')  return { label: 'Entry possible via niche',       color: 'amber',   Icon: AlertTriangle, show: true  };
  if (decision === 'test-first')                return { label: 'Viable only with niche strategy', color: 'amber',   Icon: AlertTriangle, show: true  };
  if (decision === 'proceed')                   return { label: 'Direct entry possible',           color: 'emerald', Icon: CheckCircle,   show: true  };
  return                                               { label: '',                                color: 'rose',    Icon: XCircle,       show: false };
}

// ─── Confidence bullets (data-grounded, no fake %) ───────────────────────────

function buildConfidenceBullets(result: EnhancedValidationResult): string[] {
  const m = result.metrics;
  const bullets: string[] = [];
  if (m?.totalApps)
    bullets.push(`${m.totalApps} apps analyzed`);
  if (m?.marketLocked || m?.marketDominance === 'HIGH')
    bullets.push('strong review concentration');
  else if (m?.marketDominance === 'MEDIUM')
    bullets.push('moderate review concentration');
  else if (m?.totalApps)
    bullets.push('low review concentration');
  if (m?.ratingVariance != null)
    bullets.push(m.ratingVariance < 0.1 ? 'consistent ratings across apps' : 'varied ratings across apps');
  return bullets;
}

// ─── Failure bullets — why the generic/direct approach fails ─────────────────

function buildFailureBullets(result: EnhancedValidationResult): string[] {
  const bullets: string[] = [];
  const m = result.metrics;
  const isNiche = result.bestEntryStrategy === 'ENTER_VIA_NICHE';

  if (m?.top5ReviewShare != null && m.top5ReviewShare > 0.5)
    bullets.push(isNiche
      ? `Top 5 apps control ${pct(m.top5ReviewShare)} of all reviews in the broad market`
      : `Top 5 apps control ${pct(m.top5ReviewShare)} of all reviews — generic apps can't break through`);
  if (m?.top1ReviewShare != null && m.top1ReviewShare > 0.3)
    bullets.push(isNiche
      ? `The #1 app alone holds ${pct(m.top1ReviewShare)} of broad market reviews`
      : `The #1 app alone holds ${pct(m.top1ReviewShare)} of all reviews — direct competition is very difficult`);
  if (m?.top10AvgRating != null && m.top10AvgRating > 4.3)
    bullets.push(`Top 10 apps average ${m.top10AvgRating.toFixed(2)}★ — the quality bar for generic apps is very high`);
  if (m?.bottom40AvgRating != null && m?.top10AvgRating != null && m.top10AvgRating - m.bottom40AvgRating > 0.5)
    bullets.push(isNiche
      ? `Broad market incumbents average ${m.top10AvgRating.toFixed(2)}★ vs ${m.bottom40AvgRating.toFixed(2)}★ for weaker apps — a generic entry can't compete on quality alone`
      : `Weaker apps average only ${m.bottom40AvgRating.toFixed(2)}★ — incumbents are far ahead of any new generic entrant`);
  if (result.painScore < 30)
    bullets.push('No strong unmet demand detected in the broad market — a generic app would compete on features alone');

  const extra = result.failureReasons ?? result.risks ?? [];
  for (const r of extra) {
    if (bullets.length >= 5) break;
    bullets.push(r);
  }
  return bullets.slice(0, 5);
}

// ─── "What this means" derivation ─────────────────────────────────────────────

function buildWhatThisMeans(result: EnhancedValidationResult): { bullets: string[]; strategy: string | null } {
  const { metrics, rawScores, decision, bestEntryStrategy, painScore } = result;
  const bullets: string[] = [];
  const locked = metrics?.marketLocked ?? false;
  const comp   = rawScores?.competitionScore ?? 0;

  if (locked)
    bullets.push('Competing directly in this market will almost certainly fail — incumbents are entrenched');
  else if (metrics?.marketDominance === 'HIGH' || comp >= 7)
    bullets.push('Direct entry is extremely difficult — review concentration creates a real switching cost moat');
  else if (comp >= 5)
    bullets.push('This space is crowded — a clear differentiator is required to gain any traction');

  if (painScore < 30)
    bullets.push('Users appear satisfied with existing solutions — unsolicited demand is low');
  else if (painScore >= 60)
    bullets.push('Real user frustration exists — demand for a better solution is validated');
  else
    bullets.push('Demand signals are moderate — the pain exists but is not acute');

  if      (bestEntryStrategy === 'ENTER_VIA_NICHE')  bullets.push('Only a focused niche strategy has a viable path to traction');
  else if (bestEntryStrategy === 'NO_VIABLE_ENTRY')  bullets.push('No viable entry angle was identified across all evaluated keywords');
  else if (decision === 'proceed')                   bullets.push('The market has room for a well-positioned new entrant');

  let strategy: string | null = null;
  if (bestEntryStrategy === 'ENTER_VIA_NICHE' && result.nicheAnalysis)
    strategy = `Target "${result.nicheAnalysis.bestKeyword}" — this sub-market shows materially lower competition and a more reachable audience.`;
  else if (bestEntryStrategy === 'NO_VIABLE_ENTRY')
    strategy = 'Consider pivoting to an adjacent problem with weaker incumbent presence, or a different product type entirely.';
  else if (decision === 'proceed')
    strategy = 'Move quickly — validate with 10 real users before writing any code to confirm the pain is acute enough.';
  else if (decision === 'test-first')
    strategy = 'Run a focused validation experiment (landing page or Reddit post) before committing to build.';

  return { bullets: bullets.slice(0, 3), strategy };
}

// ─── Actionable steps for strategy block ─────────────────────────────────────

function buildActionableSteps(result: EnhancedValidationResult): Array<{ label: string; text: string }> {
  const { decision, bestEntryStrategy, nicheAnalysis, painAnalysis } = result;
  const topCluster = painAnalysis?.topPainClusters?.[0]?.cluster;

  let positioning: string;
  if (bestEntryStrategy === 'ENTER_VIA_NICHE' && nicheAnalysis)
    positioning = `Target "${nicheAnalysis.bestKeyword}" — avoid competing with the broad market`;
  else if (decision === 'proceed')
    positioning = 'Enter as the simpler, more accessible option for underserved users';
  else
    positioning = 'Find a specific user segment that is underserved by existing solutions';

  let differentiation: string;
  if (topCluster === 'pricing')
    differentiation = 'Lead with transparent pricing or a lower-cost tier — cost is the top complaint';
  else if (topCluster === 'ux')
    differentiation = 'Simplify the core workflow — existing apps are frustrating users';
  else if (topCluster === 'missing_features')
    differentiation = 'Ship the missing workflow incumbents have ignored';
  else if (topCluster === 'performance')
    differentiation = 'Optimize for speed and reliability where competitors fall short';
  else
    differentiation = 'Focus on one core use case and do it significantly better than anyone else';

  let goal: string;
  if (bestEntryStrategy === 'NO_VIABLE_ENTRY')
    goal = 'Validate whether a narrower problem definition changes the market picture';
  else if (decision === 'drop')
    goal = 'Confirm real user pain exists before committing any further resources';
  else
    goal = 'Get 10 people to say they would pay before writing a single line of code';

  return [
    { label: 'Positioning', text: positioning },
    { label: 'Differentiation', text: differentiation },
    { label: 'Goal', text: goal },
  ];
}

// ─── Decisive one-liner under market label ────────────────────────────────────

function getDecisionStatement(result: EnhancedValidationResult): string | null {
  const { decision, bestEntryStrategy, metrics } = result;
  const locked    = metrics?.marketLocked ?? false;
  const dominance = metrics?.marketDominance;

  if (bestEntryStrategy === 'NO_VIABLE_ENTRY')
    return 'Do not enter this market. No viable angle was identified.';
  if (bestEntryStrategy === 'ENTER_VIA_NICHE') {
    if (locked)     return 'Do not enter this market directly. Only a focused niche strategy has any chance.';
    if (dominance === 'HIGH') return 'Do not compete broadly. Only niche entry has a viable path.';
    return 'Direct entry is risky. Only niche entry has a viable path.';
  }
  if (decision === 'drop') {
    if (locked) return 'Do not enter this market. Incumbents are too entrenched to displace.';
    return 'Do not build for this broad market without a clear structural differentiator.';
  }
  if (decision === 'test-first')
    return 'Validate before building. The market has competition — you need evidence of real demand first.';
  if (decision === 'proceed')
    return 'This market has room. Move fast and validate with real users before writing code.';
  return null;
}

// ─── Entry difficulty (LOW / MEDIUM / HIGH) ───────────────────────────────────

function computeEntryDifficulty(result: EnhancedValidationResult): 'LOW' | 'MEDIUM' | 'HIGH' {
  const locked    = result.metrics?.marketLocked ?? false;
  const dominance = result.metrics?.marketDominance;
  const quality   = result.metrics?.top10AvgRating ?? 0;
  const qScore    = result.rawScores?.qualityBarrierScore ?? 0;
  const mPower    = result.rawScores?.marketPowerScore ?? 0;

  if (locked)                                                        return 'HIGH';
  if (dominance === 'HIGH' && quality > 4.3)                        return 'HIGH';
  if (qScore >= 7 || mPower >= 7)                                   return 'HIGH';
  if (dominance === 'HIGH' || qScore >= 4 || mPower >= 5 || quality > 4.3) return 'MEDIUM';
  return 'LOW';
}

// ─── Quantified "where to win" signals from pain clusters ─────────────────────

function buildQuantifiedWinSignals(result: EnhancedValidationResult): string[] {
  const clusters = result.painAnalysis?.topPainClusters ?? [];
  if (clusters.length > 0) {
    return clusters.slice(0, 3).map(({ cluster, share }) => {
      const s = share >= 90 ? `most signals (~${share}%)` : share >= 75 ? `~${share}% of signals` : `${share}% of signals`;
      switch (cluster) {
        case 'ux':               return `Onboarding or usability complaints in ${s}`;
        case 'pricing':          return `Pricing frustration mentioned in ${s}`;
        case 'missing_features': return `Missing feature requests detected in ${s}`;
        case 'performance':      return `Performance issues reported in ${s}`;
        case 'bugs':             return `Bug and stability complaints in ${s}`;
        default:                 return `${cluster} issues in ${s}`;
      }
    });
  }
  return result.opportunityInsights ?? [];
}

// ─── Niche comparison bullets ──────────────────────────────────────────────────

function buildNicheWhyBullets(
  nicheAnalysis: NonNullable<EnhancedValidationResult['nicheAnalysis']>,
  rawScores: EnhancedValidationResult['rawScores'],
  metrics: EnhancedValidationResult['metrics'],
): string[] {
  const bullets: string[] = [];
  const baseComp  = rawScores?.competitionScore  ?? 0;
  const nicheComp = nicheAnalysis.bestKeywordScores.competitionScore;
  const basePower = rawScores?.marketPowerScore  ?? 0;
  const nichePower= nicheAnalysis.bestKeywordScores.marketPowerScore;
  const baseOpp   = rawScores?.opportunityScore  ?? 0;
  const nicheOpp  = nicheAnalysis.bestKeywordScores.opportunityScore;

  if (baseComp > 0 && nicheComp < baseComp - 0.5) {
    const ratio = (baseComp / Math.max(nicheComp, 0.1)).toFixed(1);
    bullets.push(`${ratio}× lower competition than the base market`);
  }
  if (nichePower < basePower - 1)
    bullets.push('Lower review dominance — market power is less concentrated in this niche');
  else if (metrics?.top5ReviewShare != null)
    bullets.push('Narrower audience means fewer entrenched incumbents to displace');
  if (nicheOpp > baseOpp + 0.5)
    bullets.push(`Higher opportunity score (${nicheOpp.toFixed(1)}/10 vs ${baseOpp.toFixed(1)}/10 broad market)`);

  return bullets.slice(0, 3);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p className={cn('text-[10px] font-bold uppercase tracking-widest', color ?? 'text-muted-foreground/70')}>
      {children}
    </p>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 rounded-lg bg-muted/30 border border-border/60">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
      <span className="text-lg font-black tabular-nums leading-tight text-foreground/90">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground/55 leading-tight">{sub}</span>}
    </div>
  );
}

function MetricBar({ label, score, invert = false }: { label: string; score: number; invert?: boolean }) {
  const level = getLevel(score);
  const tone  = metricTone(level, invert);
  return (
    <div className="grid grid-cols-[128px_60px_minmax(0,1fr)_32px] items-center gap-3">
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      <span className={cn('text-[11px] font-bold tracking-wider', colorClass(tone, 'text'))}>{level}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
        <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', colorClass(tone, 'bg'))}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <span className="text-right text-xs font-semibold tabular-nums text-muted-foreground/50">{score}</span>
    </div>
  );
}

function CompareRow({ label, base, niche, lowerBetter }: {
  label: string; base: number; niche: number; lowerBetter: boolean;
}) {
  const improved = lowerBetter ? niche < base - 0.05 : niche > base + 0.05;
  const pctDiff  = base > 0.05 ? Math.abs(Math.round(((niche - base) / base) * 100)) : 0;
  const arrow    = (lowerBetter && niche < base) || (!lowerBetter && niche > base) ? '↓' : '↑';
  const label2   = lowerBetter
    ? (niche < base ? `${arrow} ${pctDiff}% lower` : `${arrow} ${pctDiff}% higher`)
    : (niche > base ? `${arrow} ${pctDiff}% higher` : `${arrow} ${pctDiff}% lower`);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 shrink-0 text-muted-foreground/55">{label}:</span>
      <span className="font-mono text-foreground/50">{base.toFixed(1)}</span>
      <span className="text-muted-foreground/30">→</span>
      <span className={cn('font-mono font-bold', improved ? 'text-emerald-400' : 'text-muted-foreground/60')}>
        {niche.toFixed(1)}
      </span>
      {pctDiff > 0 && (
        <span className={cn('text-[10px] font-semibold', improved ? 'text-emerald-400/70' : 'text-muted-foreground/40')}>
          {label2}
        </span>
      )}
    </div>
  );
}

function ScoreBreakdownRow({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)_40px] items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/65 leading-tight">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
        <div className={cn('h-full rounded-full', colorClass(tone, 'bg'))}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className={cn('text-right text-xs font-semibold tabular-nums', colorClass(tone, 'text'))}>{value}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ValidationReport({ result, competitors }: ValidationReportProps) {
  const router = useRouter();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const {
    score, painScore, competitionScore, opportunityScore,
    verdict, signals, risks,
    confidence, confidenceReason,
    decision, decisionReason, nextStep, nextStepType,
    validationEffort, scoreBreakdown, evidencedSignals,
    failureReasons, marketHardness, competitorInsights, whereToWin,
    willingnessToPay, keyInsights, marketInsights, opportunityInsights,
    metrics, nicheAnalysis, bestEntryStrategy, rawScores,
  } = result;

  const isDrop    = decision === 'drop';
  const isProceed = decision === 'proceed';
  const isTest    = decision === 'test-first';
  const hasNiche  = !!(nicheAnalysis && bestEntryStrategy === 'ENTER_VIA_NICHE');

  const { label: marketLabel, color: marketColor, Icon: MarketIcon } = getMarketReality(result);
  const entryConfig       = getEntryPossibility(result);
  const decisionStatement = getDecisionStatement(result);
  const entryDifficulty   = computeEntryDifficulty(result);
  const confidenceBullets = buildConfidenceBullets(result);
  const failureBullets    = buildFailureBullets(result);
  const quantifiedWinSignals = buildQuantifiedWinSignals(result);
  const { bullets: meaningBullets } = buildWhatThisMeans(result);
  const actionableSteps   = buildActionableSteps(result);

  // Market reality bullets — data-grounded strings from the engine
  const marketBullets: string[] = (() => {
    if (marketInsights && marketInsights.length > 0) return marketInsights.slice(0, 3);
    if (keyInsights    && keyInsights.length > 0)    return keyInsights.slice(0, 3);
    if (isDrop) return (failureReasons ?? risks).slice(0, 3);
    if (isProceed) return signals.slice(0, 3);
    return [...signals.slice(0, 2), ...(failureReasons ?? risks).slice(0, 1)];
  })();

  // Suppress unused — opportunityInsights is now routed through buildQuantifiedWinSignals
  void opportunityInsights;

  // Niche scores for comparison table
  const baseComp  = rawScores?.competitionScore  ?? 0;
  const baseOpp   = rawScores?.opportunityScore  ?? 0;
  const nicheComp = nicheAnalysis?.bestKeywordScores.competitionScore ?? 0;
  const nicheOpp  = nicheAnalysis?.bestKeywordScores.opportunityScore ?? 0;
  const nicheWhyBullets = nicheAnalysis
    ? buildNicheWhyBullets(nicheAnalysis, rawScores, metrics)
    : [];

  // Niche opportunity score (0–100) for separate metric bar
  const nicheOpportunityScore = nicheAnalysis
    ? Math.round(nicheAnalysis.bestKeywordScores.opportunityScore * 10)
    : null;

  // "Your Move"
  const displayNextStep = (() => {
    if (hasNiche && nicheAnalysis)
      return `Validate the "${nicheAnalysis.bestKeyword}" angle — post a problem description in a relevant community and measure genuine interest before building.`;
    return nextStep ?? (decision ? ({
      proceed:      'Talk to 5 potential users this week — validate the problem before writing code',
      'test-first': 'Post this problem in a relevant community and measure engagement before building',
      drop:         'Pivot to a narrower segment or a problem space with weaker existing competition',
    } as Record<string, string>)[decision] : undefined);
  })();

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
    ? [...evidencedSignals].sort((a, b) =>
        ({ strong: 0, moderate: 1, weak: 2 }[a.strength] - { strong: 0, moderate: 1, weak: 2 }[b.strength]))
    : signals.slice(0, 5).map((s) => ({ text: s, strength: 'moderate' as const }));

  const VALIDATION_STEP_TYPES = new Set(['reddit-post', 'landing-page', 'interviews', 'survey']);
  const STEP_LABEL: Record<string, string> = {
    'reddit-post': 'Write Reddit Post', 'landing-page': 'Build Landing Page',
    interviews: 'Plan Interviews', prototype: 'Sketch Prototype', survey: 'Create Survey', other: 'Take Action',
  };

  const showPrimaryAction = !isDrop && !!nextStepType && !!STEP_LABEL[nextStepType] &&
    (isProceed ? true : isTest ? VALIDATION_STEP_TYPES.has(nextStepType) : true);
  const showStartBuilding = isProceed || !decision;

  const compColor: Tone = competitionScore >= 70 ? 'rose' : competitionScore >= 40 ? 'amber' : 'emerald';
  const detailedBreakdown = scoreBreakdown?.pain && scoreBreakdown?.competition && scoreBreakdown?.opportunity
    ? [
        { title: 'Pain',        total: painScore,        tone: scoreColor(painScore),        items: scoreBreakdown.pain },
        { title: 'Competition', total: competitionScore, tone: compColor,                    items: scoreBreakdown.competition },
        { title: 'Opportunity', total: opportunityScore, tone: scoreColor(opportunityScore), items: scoreBreakdown.opportunity },
      ]
    : null;

  const hasAdvanced = !!(competitorItems.length || signalItems.length || detailedBreakdown || willingnessToPay || allEvidence.length);

  async function copyNextStep() {
    if (!nextStep) return;
    try { await navigator.clipboard.writeText(nextStep); toast.success('Copied'); }
    catch { toast.error('Could not copy'); }
  }

  // Section visibility
  const hasSnapshot = !!(metrics?.totalApps);
  const hasNicheSection = !!(nicheAnalysis && nicheAnalysis.evaluatedKeywords.length > 1);

  // "Where you could win" heading + tone
  const winHeading  = isProceed ? 'Your edge' : hasNiche ? 'Where you could win' : isDrop ? 'Possible pivots' : 'Where you could win';
  const winTone: Tone = (isDrop && !hasNiche) ? 'amber' : hasNiche ? 'amber' : 'emerald';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ══ SECTION 1: TWO-LEVEL VERDICT ══════════════════════════════════════ */}
      <div className={cn(
        'rounded-xl border px-6 py-6',
        marketColor === 'emerald' && 'border-emerald-500/25 bg-emerald-500/[0.05]',
        marketColor === 'amber'   && 'border-amber-500/25   bg-amber-500/[0.05]',
        marketColor === 'rose'    && 'border-rose-500/25    bg-rose-500/[0.05]',
      )}>
        {/* Level 1 — market reality (dominant) */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <MarketIcon className={cn('h-6 w-6 shrink-0', colorClass(marketColor, 'text'))} />
            <span className={cn('text-3xl font-black tracking-tight leading-none', colorClass(marketColor, 'text'))}>
              {marketLabel}
            </span>
          </div>
          {/* Score — visually deprioritized */}
          <span className="text-xs font-mono text-muted-foreground/35 mt-1 shrink-0 tabular-nums">{score}/100</span>
        </div>

        {/* Level 2 — entry possibility (secondary) */}
        {entryConfig.show && (
          <div className="mt-3 flex items-center gap-2">
            <entryConfig.Icon className={cn('h-3.5 w-3.5 shrink-0', colorClass(entryConfig.color, 'text'))} />
            <span className={cn('text-sm font-semibold tracking-wide', colorClass(entryConfig.color, 'text'))}>
              {entryConfig.label}
            </span>
          </div>
        )}

        {/* Decision statement — one decisive sentence */}
        {decisionStatement && (
          <p className="mt-3 text-sm font-semibold text-foreground/85 leading-snug">
            {decisionStatement}
          </p>
        )}

        {/* Data-grounded market bullets */}
        {marketBullets.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {marketBullets.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-snug">
                <span className={cn('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full', colorClass(marketColor, 'bg'))} />
                {r}
              </li>
            ))}
          </ul>
        )}

        {/* Difficulty + Confidence row */}
        <div className="mt-4 pt-3.5 border-t border-border/40 flex flex-wrap items-center gap-x-5 gap-y-2">
          {/* Entry difficulty */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground/70">Entry difficulty:</span>
            <span className={cn('text-xs font-bold',
              entryDifficulty === 'HIGH'   ? 'text-rose-500'
              : entryDifficulty === 'MEDIUM' ? 'text-amber-500'
              : 'text-emerald-500'
            )}>
              {entryDifficulty}
            </span>
            <span className="text-xs text-muted-foreground/60">
              {entryDifficulty === 'HIGH'
                ? '— high quality bar, concentrated reviews'
                : entryDifficulty === 'MEDIUM'
                ? '— moderate incumbents, room to differentiate'
                : '— low barriers, good window to enter'}
            </span>
          </div>
          {/* Confidence */}
          {confidence && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground/70">Confidence:</span>
                <span className={cn('text-xs font-bold', colorClass(
                  confidence === 'high' ? 'emerald' : confidence === 'medium' ? 'amber' : 'rose', 'text'
                ))}>
                  {cap(confidence)}
                </span>
              </div>
              {confidenceBullets.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {confidenceBullets.map((b, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground/65 flex items-center gap-1">
                      <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ SECTION 2: MARKET SNAPSHOT (mobile engine only) ══════════════════ */}
      {hasSnapshot && metrics && (
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionHeading>Market snapshot</SectionHeading>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Apps analyzed"   value={`${metrics.totalApps}`} sub="in this category" />
            <StatTile label="Top-5 dominance" value={metrics.top5ReviewShare != null ? pct(metrics.top5ReviewShare) : '—'} sub="of all reviews" />
            {metrics.top1ReviewShare != null && metrics.top1ReviewShare > 0 && (
              <StatTile label="Market leader"    value={pct(metrics.top1ReviewShare)} sub="#1 app's review share" />
            )}
            {metrics.top10AvgRating != null && metrics.top10AvgRating > 0 && (
              <StatTile label="Leader avg rating" value={`${metrics.top10AvgRating.toFixed(1)}★`} sub="top 10 by reviews" />
            )}
          </div>
          {metrics.ratingDistributionAbove45 != null && (
            <p className="mt-2.5 text-xs text-muted-foreground/50 leading-snug">
              {pct(metrics.ratingDistributionAbove45)} of apps rated 4.5★ or above
              {metrics.marketLocked && (
                <span className="ml-2 text-rose-400/80 font-semibold">· structurally locked</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* ══ SECTION 3: MARKET SIGNALS ════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <SectionHeading>Market signals</SectionHeading>
        <div className="mt-3.5 flex flex-col gap-3.5">
          <MetricBar label="Competition"        score={competitionScore} invert />
          <MetricBar label="Demand (pain)"      score={painScore} />
          <MetricBar label="Market opportunity" score={opportunityScore} />
          {nicheOpportunityScore != null && bestEntryStrategy === 'ENTER_VIA_NICHE' && nicheAnalysis && (
            <div className="pt-1.5 border-t border-border/50">
              {/* Never show "LOW" for a viable niche — use interpreted labels instead */}
              <div className="grid grid-cols-[128px_60px_minmax(0,1fr)_32px] items-center gap-3">
                <span className="text-sm font-semibold text-foreground/80">Niche opportunity</span>
                <span className={cn('text-[11px] font-bold tracking-wider',
                  nicheOpportunityScore >= 60 ? 'text-emerald-500'
                  : nicheOpportunityScore >= 35 ? 'text-amber-500'
                  : 'text-amber-400'
                )}>
                  {nicheOpportunityScore >= 60 ? 'STRONG' : nicheOpportunityScore >= 35 ? 'VIABLE WITH EXECUTION' : 'NICHE ENTRY ONLY'}
                </span>
                <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
                  <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out',
                    nicheOpportunityScore >= 60 ? 'bg-emerald-500' : 'bg-amber-500'
                  )} style={{ width: `${Math.max(0, Math.min(100, nicheOpportunityScore))}%` }} />
                </div>
                <span className="text-right text-xs font-semibold tabular-nums text-muted-foreground/50">
                  {nicheOpportunityScore}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground/45 pl-[calc(128px+12px)]">
                for &ldquo;{nicheAnalysis.bestKeyword}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══ SECTION 4: WHAT THIS MEANS ═══════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card px-5 py-5">
        <SectionHeading>What this means for you</SectionHeading>
        <ul className="mt-3 flex flex-col gap-2">
          {meaningBullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-snug">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              {b}
            </li>
          ))}
        </ul>
        {actionableSteps.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-border/50 flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55">Action plan</span>
            {actionableSteps.map(({ label, text }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/60 border border-border/50 shrink-0 mt-[2px]">
                  {label}
                </span>
                <p className="text-sm text-foreground/80 leading-snug">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ SECTION 5: RECOMMENDED ENTRY NICHE ══════════════════════════════ */}
      {hasNicheSection && nicheAnalysis && (
        <div className={cn(
          'rounded-xl border px-5 py-5',
          bestEntryStrategy === 'ENTER_VIA_NICHE'   && 'border-amber-500/25 bg-amber-500/[0.04]',
          bestEntryStrategy === 'NO_VIABLE_ENTRY'   && 'border-rose-500/15  bg-rose-500/[0.03]',
          bestEntryStrategy === 'BROAD_MARKET'      && 'border-border bg-card',
        )}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <SectionHeading color={
              bestEntryStrategy === 'ENTER_VIA_NICHE' ? 'text-amber-400'
              : bestEntryStrategy === 'NO_VIABLE_ENTRY' ? 'text-rose-400/70'
              : undefined
            }>
              {bestEntryStrategy === 'ENTER_VIA_NICHE' ? 'Recommended entry niche' : 'Best entry market'}
            </SectionHeading>
            <span className="text-[10px] text-muted-foreground/35 font-mono shrink-0">
              {nicheAnalysis.evaluatedKeywords.length} keywords analyzed
            </span>
          </div>

          {/* Keyword + label */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={cn(
              'text-lg font-black tracking-tight',
              bestEntryStrategy === 'ENTER_VIA_NICHE' ? 'text-amber-400' : 'text-foreground/90',
            )}>
              &ldquo;{nicheAnalysis.bestKeyword}&rdquo;
            </span>
            {bestEntryStrategy === 'ENTER_VIA_NICHE' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/12 text-amber-400 border border-amber-500/20">
                Lower competition niche
              </span>
            )}
            {bestEntryStrategy === 'BROAD_MARKET' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted/50 text-muted-foreground/60">
                Broad market
              </span>
            )}
          </div>

          {/* Why this niche */}
          {nicheWhyBullets.length > 0 && (
            <div className="mt-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Why this niche</span>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {nicheWhyBullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/75 leading-snug">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-400/60" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Score comparison */}
          {(baseComp > 0 || baseOpp > 0) && (
            <div className="mt-4 pt-3.5 border-t border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Base market vs niche</span>
              <div className="mt-2 flex flex-col gap-2">
                <CompareRow label="Competition" base={baseComp} niche={nicheComp} lowerBetter />
                <CompareRow label="Opportunity" base={baseOpp}  niche={nicheOpp}  lowerBetter={false} />
              </div>
            </div>
          )}

          {/* Alternative keywords */}
          {nicheAnalysis.alternativeKeywords.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-muted-foreground/40 font-medium">Also evaluated:</span>
              {nicheAnalysis.alternativeKeywords.map((kw) => (
                <span key={kw} className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted/40 text-muted-foreground/60 border border-border/50">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ SECTION 6: WHY IT FAILS + WHERE TO WIN ═══════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Why direct/generic entry fails */}
        <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.03] px-5 py-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-rose-400/80 shrink-0" />
            <SectionHeading color="text-rose-400/80">
              {hasNiche ? 'Why direct entry fails' : 'Why most apps fail here'}
            </SectionHeading>
          </div>
          {/* Context framing — strategy, not idea */}
          {metrics?.marketLocked && (
            <p className="text-sm font-medium text-rose-300/75 leading-snug mb-3">
              {hasNiche
                ? 'Direct entry into the broad market is structurally blocked — incumbents are too entrenched.'
                : 'The broad market is structurally blocked — incumbents dominate review share and quality.'}
            </p>
          )}
          {failureBullets.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {failureBullets.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/75 leading-snug">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/50" />
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground/60">{marketHardness ?? decisionReason ?? verdict}</p>
          )}
          {marketHardness && failureBullets.length > 0 && (
            <p className="mt-3.5 text-xs text-rose-400/40 italic leading-snug border-t border-rose-500/10 pt-3">
              {marketHardness}
            </p>
          )}
        </div>

        {/* Where you could win */}
        <div className={cn(
          'rounded-xl border px-5 py-5',
          winTone === 'amber'   && 'border-amber-500/15   bg-amber-500/[0.03]',
          winTone === 'emerald' && 'border-emerald-500/15 bg-emerald-500/[0.03]',
        )}>
          <div className="flex items-center gap-2 mb-3.5">
            {winTone === 'amber'
              ? <AlertTriangle className="h-4 w-4 text-amber-400/80 shrink-0" />
              : <Target       className="h-4 w-4 text-emerald-400    shrink-0" />
            }
            <SectionHeading color={winTone === 'amber' ? 'text-amber-400/80' : 'text-emerald-400'}>
              {winHeading}
            </SectionHeading>
          </div>

          {/* Quantified pain signals — cluster-based, never vague */}
          {quantifiedWinSignals.length > 0 && (
            <ul className="mb-3.5 flex flex-col gap-1.5 border-b border-border/50 pb-3.5">
              {quantifiedWinSignals.slice(0, 3).map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground/65 leading-snug flex items-start gap-2">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                  {s}
                </li>
              ))}
            </ul>
          )}

          {whereToWin && whereToWin.length > 0 ? (
            <ul className="flex flex-col gap-3.5">
              {whereToWin.slice(0, 3).map((insight, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <span className={cn(
                    'inline-flex w-fit text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                    winTone === 'amber' ? 'bg-amber-500/10 text-amber-400/80' : 'bg-emerald-500/10 text-emerald-400',
                  )}>
                    {insight.title}
                  </span>
                  {insight.gap && (
                    <p className="text-[11px] text-muted-foreground/55 leading-snug">Signal: {insight.gap}</p>
                  )}
                  <p className={cn(
                    'text-sm leading-snug',
                    winTone === 'amber' ? 'text-foreground/72' : isProceed ? 'text-foreground/90 font-semibold' : 'text-foreground/82',
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
            <p className="text-sm text-muted-foreground/50">No clear angle identified.</p>
          )}
        </div>
      </div>

      {/* ══ SECTION 7: YOUR MOVE ═════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card px-6 py-5 flex flex-col gap-4">
        <div>
          <SectionHeading>Your move</SectionHeading>
          <p className="mt-2 text-sm font-semibold text-foreground leading-snug">{displayNextStep}</p>
          {(!isDrop || hasNiche) && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              {(['Test demand', 'Validate pain', 'Measure response'] as const).map((step, i, arr) => (
                <span key={step} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground/65 border border-border/50">
                    {step}
                  </span>
                  {i < arr.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30 shrink-0" />}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {isDrop && !hasNiche ? (
            <Button variant="outline" size="sm" className="w-full justify-between" onClick={() => router.push('/validate')}>
              Try Another Angle <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : isDrop && hasNiche ? (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 justify-between" onClick={copyNextStep}>
                Copy Strategy <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/validate')}>
                Try Another Angle
              </Button>
            </div>
          ) : (
            <>
              {showPrimaryAction && (
                <Button size="sm" className="w-full justify-between">
                  {STEP_LABEL[nextStepType!]} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={copyNextStep}>
                  <Copy className="h-3 w-3" /> Copy
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
            {[{ k: 'Time', v: validationEffort.time }, { k: 'Cost', v: validationEffort.cost }, { k: 'Level', v: cap(validationEffort.difficulty) }].map(({ k, v }) => (
              <div key={k}>
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">{k}</p>
                <p className="text-[11px] font-semibold text-foreground/85 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ SECTION 8: ADVANCED ANALYSIS (collapsed) ════════════════════════ */}
      {hasAdvanced && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <SectionHeading>Advanced analysis</SectionHeading>
              <span className="text-xs text-muted-foreground/45 -mt-[2px]">competitors · breakdown · evidence</span>
            </div>
            {advancedOpen
              ? <ChevronUp   className="h-4 w-4 text-muted-foreground/50" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
            }
          </button>

          {advancedOpen && (
            <div className="border-t border-border px-6 pb-6 pt-6 flex flex-col gap-6">

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
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/70">{c.platform}</span>
                            )}
                            {c.rating != null && (
                              <span className="text-[10px] font-medium text-amber-400/80">
                                ★ {c.rating.toFixed(1)}{c.reviewCount ? ` (${c.reviewCount.toLocaleString()})` : ''}
                              </span>
                            )}
                            <a href={c.url} target="_blank" rel="noopener noreferrer"
                              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground/60 hover:text-foreground bg-muted/30 hover:bg-muted/60 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> Visit
                            </a>
                          </div>
                          {ins ? (
                            <div className="pl-[26px] flex flex-col gap-1">
                              <p className="text-xs text-foreground/75 leading-snug"><span className="text-emerald-500/80 font-medium">↳ </span>{ins.whyChosen}</p>
                              <p className="text-xs text-foreground/75 leading-snug"><span className="text-rose-500/80 font-medium">✕ </span>{ins.weakness}</p>
                            </div>
                          ) : c.snippet ? (
                            <p className="pl-[26px] text-xs text-muted-foreground/80 leading-snug line-clamp-2">{c.snippet}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {detailedBreakdown && (
                <div className={cn('flex flex-col gap-5', competitorItems.length > 0 && 'border-t border-border pt-5')}>
                  <SectionHeading>Score breakdown</SectionHeading>
                  {detailedBreakdown.map((group) => (
                    <div key={group.title} className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 w-24">{group.title}</span>
                        <span className={cn('text-xs font-semibold tabular-nums', colorClass(group.tone, 'text'))}>{group.total}</span>
                      </div>
                      <div className="ml-2 flex flex-col gap-2">
                        {group.items.map((item) => (
                          <ScoreBreakdownRow key={`${group.title}-${item.label}`} label={item.label} value={item.score} tone={group.tone} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {willingnessToPay && (
                <div className="border-t border-border pt-5 flex flex-col gap-3">
                  <SectionHeading>Willingness to Pay</SectionHeading>
                  <span className={cn('text-2xl font-bold leading-none',
                    willingnessToPay.level === 'high' ? 'text-emerald-500' : willingnessToPay.level === 'medium' ? 'text-amber-500' : 'text-rose-500'
                  )}>{cap(willingnessToPay.level)}</span>
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

              {(allEvidence.length > 0 || signalItems.length > 0) && (
                <div className="border-t border-border pt-5 grid gap-5 sm:grid-cols-2">
                  {allEvidence.length > 0 && (
                    <div>
                      <SectionHeading>Evidence signals</SectionHeading>
                      <ul className="mt-3 flex flex-col gap-2">
                        {allEvidence.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-snug">
                            <span className={cn('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full',
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
                            <a href={c.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-muted-foreground/80 hover:text-muted-foreground transition-colors leading-snug truncate">
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

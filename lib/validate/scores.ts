import type { ElementType } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Tone } from './colors';

export interface VerdictConfig {
  label: string;
  sublabel?: string;
  color: Tone;
  Icon: ElementType;
  structureNote?: string;
}

export interface EntryConfig extends VerdictConfig {
  show: boolean;
}

export interface ValidationDelta {
  scoreDiff: number;
  competitionDiff: number;
  opportunityDiff: number;
  painDiff: number;
  decisionChanged: boolean;
  prevDecision: string;
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function getMarketReality(
  result: EnhancedValidationResult
): VerdictConfig {
  const locked = result.metrics?.marketLocked ?? false;
  const dominance = result.metrics?.marketDominance;
  const comp = result.rawScores?.competitionScore ?? 0;

  const isHighComp = comp >= 7;
  const isMedComp = comp >= 4;
  const concentrated = dominance === 'HIGH';
  const fragmented = dominance === 'LOW' || dominance == null;

  if (locked)
    return {
      label: 'MARKET IS LOCKED',
      sublabel: 'Incumbents dominate review share and quality bar',
      color: 'rose',
      Icon: XCircle,
    };

  if (isHighComp && concentrated)
    return {
      label: 'HIGHLY COMPETITIVE',
      sublabel: 'Saturated — a few players control most reviews',
      color: 'rose',
      Icon: XCircle,
    };

  if (isHighComp && !fragmented)
    return {
      label: 'HIGHLY COMPETITIVE',
      sublabel: 'Crowded — moderate review concentration',
      color: 'rose',
      Icon: XCircle,
    };

  if (isHighComp)
    return {
      label: 'ACCESSIBLE — DIFFERENTIATION REQUIRED',
      sublabel: 'Competitive but fragmented — no dominant incumbent',
      color: 'amber',
      Icon: AlertTriangle,
      structureNote:
        'High app count but no single player controls the market. Competition is real, but the absence of a dominant incumbent means a well-differentiated entry can still find an audience.',
    };

  if (isMedComp && concentrated)
    return {
      label: 'MODERATELY COMPETITIVE',
      sublabel: 'Established leaders hold significant review share',
      color: 'amber',
      Icon: AlertTriangle,
    };

  if (isMedComp && !fragmented)
    return {
      label: 'MODERATELY COMPETITIVE',
      sublabel: 'Some concentration — clear leaders present',
      color: 'amber',
      Icon: AlertTriangle,
    };

  if (isMedComp)
    return {
      label: 'OPEN BUT COMPETITIVE',
      sublabel: 'Active market, no single dominant player',
      color: 'amber',
      Icon: AlertTriangle,
      structureNote:
        'Competition is present but the market is fragmented — no incumbent controls it. Entry is possible with a focused angle and clear differentiation.',
    };

  if (concentrated)
    return {
      label: 'LOW COMPETITION',
      sublabel: 'Few apps — but some have concentrated review share',
      color: 'emerald',
      Icon: CheckCircle,
      structureNote:
        'Few competitors, but existing apps hold strong positions. A quality bar exists even in a less crowded space — polish and trust signals matter.',
    };

  return {
    label: 'OPEN MARKET',
    sublabel: 'Low competition, no dominant incumbents',
    color: 'emerald',
    Icon: CheckCircle,
  };
}

export function getEntryPossibility(
  result: EnhancedValidationResult
): EntryConfig {
  const { decision, bestEntryStrategy } = result;
  if (bestEntryStrategy === 'NO_VIABLE_ENTRY')
    return {
      label: 'No viable entry found',
      color: 'rose',
      Icon: XCircle,
      show: true,
    };
  if (bestEntryStrategy === 'ENTER_VIA_NICHE')
    return {
      label: 'Entry possible via niche',
      color: 'amber',
      Icon: AlertTriangle,
      show: true,
    };
  if (decision === 'test-first')
    return {
      label: 'Viable only with niche strategy',
      color: 'amber',
      Icon: AlertTriangle,
      show: true,
    };
  if (decision === 'proceed')
    return {
      label: 'Direct entry possible',
      color: 'emerald',
      Icon: CheckCircle,
      show: true,
    };
  return { label: '', color: 'rose', Icon: XCircle, show: false };
}

export function computeEntryDifficulty(
  result: EnhancedValidationResult
): 'LOW' | 'MEDIUM' | 'HIGH' {
  const locked = result.metrics?.marketLocked ?? false;
  const dominance = result.metrics?.marketDominance;
  const quality = result.metrics?.top10AvgRating ?? 0;
  const qScore = result.rawScores?.qualityBarrierScore ?? 0;
  const mPower = result.rawScores?.marketPowerScore ?? 0;

  if (locked) return 'HIGH';
  if (dominance === 'HIGH' && quality > 4.3) return 'HIGH';
  if (qScore >= 7 || mPower >= 7) return 'HIGH';
  if (dominance === 'HIGH' || qScore >= 4 || mPower >= 5 || quality > 4.3)
    return 'MEDIUM';
  return 'LOW';
}

export function computeDelta(
  prev: EnhancedValidationResult,
  curr: EnhancedValidationResult
): ValidationDelta {
  return {
    scoreDiff: curr.score - prev.score,
    competitionDiff: curr.competitionScore - prev.competitionScore,
    opportunityDiff: curr.opportunityScore - prev.opportunityScore,
    painDiff: curr.painScore - prev.painScore,
    decisionChanged: prev.decision !== curr.decision,
    prevDecision: prev.decision ?? '',
  };
}

export function buildNicheWhyBullets(
  nicheAnalysis: NonNullable<EnhancedValidationResult['nicheAnalysis']>,
  rawScores: EnhancedValidationResult['rawScores'],
  metrics: EnhancedValidationResult['metrics']
): string[] {
  const bullets: string[] = [];
  const baseComp = rawScores?.competitionScore ?? 0;
  const nicheComp = nicheAnalysis.bestKeywordScores.competitionScore;
  const basePower = rawScores?.marketPowerScore ?? 0;
  const nichePower = nicheAnalysis.bestKeywordScores.marketPowerScore;
  const baseOpp = rawScores?.opportunityScore ?? 0;
  const nicheOpp = nicheAnalysis.bestKeywordScores.opportunityScore;

  if (baseComp > 0 && nicheComp < baseComp - 0.5) {
    const ratio = (baseComp / Math.max(nicheComp, 0.1)).toFixed(1);
    bullets.push(`${ratio}× lower competition than the base market`);
  }
  if (nichePower < basePower - 1)
    bullets.push(
      'Lower review dominance — market power is less concentrated in this niche'
    );
  else if (metrics?.top5ReviewShare != null)
    bullets.push(
      'Narrower audience means fewer entrenched incumbents to displace'
    );
  if (nicheOpp > baseOpp + 0.5)
    bullets.push(
      `Higher opportunity score (${nicheOpp.toFixed(1)}/10 vs ${baseOpp.toFixed(1)}/10 broad market)`
    );

  return bullets.slice(0, 3);
}

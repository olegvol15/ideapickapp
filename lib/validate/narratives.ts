import type { EnhancedValidationResult } from '@/lib/schemas';
import type { IdeaContext } from '@/types/validate.types';
import { getLevel } from './colors';
import { pct } from './scores';

function truncate(s: string, max = 45): string {
  return s.length > max ? s.slice(0, max).replace(/\s\S*$/, '') + '…' : s;
}

export function buildConfidenceBullets(result: EnhancedValidationResult): string[] {
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

export function buildFailureBullets(result: EnhancedValidationResult, ideaCtx?: IdeaContext): string[] {
  const bullets: string[] = [];
  const m       = result.metrics;
  const isNiche = result.bestEntryStrategy === 'ENTER_VIA_NICHE';
  const idea    = ideaCtx ? truncate(ideaCtx.description) : null;
  const audience = ideaCtx?.audience ?? null;

  if (m?.top5ReviewShare != null && m.top5ReviewShare > 0.5) {
    const remaining = Math.round((1 - m.top5ReviewShare) * 100);
    bullets.push(idea
      ? `Top 5 apps own ${pct(m.top5ReviewShare)} of reviews → ${idea} enters with no social proof against players that have 10x+ more accumulated ratings`
      : isNiche
        ? `Top 5 apps control ${pct(m.top5ReviewShare)} of broad market reviews → only ${remaining}% addressable share for a new generic entrant`
        : `Top 5 apps own ${pct(m.top5ReviewShare)} of all reviews → competing broadly means fighting for the remaining ${remaining}%`);
  }
  if (m?.top1ReviewShare != null && m.top1ReviewShare > 0.3)
    bullets.push(idea
      ? `#1 app alone holds ${pct(m.top1ReviewShare)} of all reviews → ${idea} would need to displace a category leader with no existing user base`
      : `#1 app alone holds ${pct(m.top1ReviewShare)} of all reviews → displacing it requires massive differentiation, not just a better UI`);
  if (m?.top10AvgRating != null && m.top10AvgRating > 4.3)
    bullets.push(idea
      ? `Top apps average ${m.top10AvgRating.toFixed(1)}★ → ${idea} must ship at this quality from day one to be taken seriously`
      : `Top 10 apps average ${m.top10AvgRating.toFixed(1)}★ → any new app must match this quality bar on day 1 to be considered`);
  if (m?.bottom40AvgRating != null && m?.top10AvgRating != null && m.top10AvgRating - m.bottom40AvgRating > 0.5)
    bullets.push(`Weaker apps average ${m.bottom40AvgRating.toFixed(1)}★ vs ${m.top10AvgRating.toFixed(1)}★ for leaders → the quality gap punishes generic entries immediately`);
  if (result.painScore < 30)
    bullets.push(idea
      ? `Low demand signals → ${audience ? `${audience} in this category` : 'users'} appear satisfied; without a specific unmet need, ${idea} growth relies on marketing spend`
      : 'Unmet demand is low in this category → without a strong pain signal, growth depends entirely on marketing spend');

  const extra = result.failureReasons ?? result.risks ?? [];
  for (const r of extra) {
    if (bullets.length >= 5) break;
    bullets.push(r);
  }
  return bullets.slice(0, 5);
}

export function buildWhatThisMeans(
  result: EnhancedValidationResult,
  ideaCtx?: IdeaContext,
): { bullets: string[]; strategy: string | null } {
  const { metrics, rawScores, decision, bestEntryStrategy, painScore } = result;
  const bullets  = [];
  const locked   = metrics?.marketLocked ?? false;
  const comp     = rawScores?.competitionScore ?? 0;
  const idea     = ideaCtx ? truncate(ideaCtx.description) : null;
  const audience = ideaCtx?.audience ?? null;

  if (locked)
    bullets.push(idea
      ? `Market is locked → ${audience ?? 'users'} already have entrenched options; ${idea} needs a niche angle to avoid direct comparison`
      : 'Market is structurally locked by incumbents → broad entry will fail; niche positioning is the only path');
  else if (metrics?.marketDominance === 'HIGH' || comp >= 7)
    bullets.push('Review concentration creates a moat → you need a defensible differentiator, not just a better interface');
  else if (comp >= 5)
    bullets.push('Competition is real → a clear, specific angle is required before acquisition costs make growth impossible');

  if (painScore >= 60)
    bullets.push(idea
      ? `Strong pain signals → ${audience ?? 'users'} are actively looking for something better — ${idea} enters a validated problem space`
      : 'Strong pain signals detected → users are actively looking for an alternative — demand is real');
  else if (painScore >= 30)
    bullets.push('Pain signals are moderate → validate the problem with 5 real users before writing code');
  else
    bullets.push(idea
      ? `Low pain signals → there's no unsolicited demand pulling users toward ${idea}; growth depends on outbound reach`
      : 'Low pain signals in this category → without a specific underserved segment, growth depends on marketing spend alone');

  if      (bestEntryStrategy === 'ENTER_VIA_NICHE')  bullets.push('Broad market is closed → enter via the identified niche to avoid direct competition with entrenched leaders');
  else if (bestEntryStrategy === 'NO_VIABLE_ENTRY')  bullets.push('No viable angle found across all evaluated keywords → consider an adjacent problem or different product type');
  else if (decision === 'proceed')                   bullets.push('Market has room → move fast to validate with real users before competition closes the window');

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

export function buildActionableSteps(
  result: EnhancedValidationResult,
  ideaCtx?: IdeaContext,
): Array<{ label: string; text: string }> {
  const { decision, bestEntryStrategy, nicheAnalysis, painAnalysis } = result;
  const topCluster = painAnalysis?.topPainClusters?.[0]?.cluster;
  const audience   = ideaCtx?.audience ?? null;
  const problem    = ideaCtx?.problem ?? null;

  let positioning: string;
  if (bestEntryStrategy === 'ENTER_VIA_NICHE' && nicheAnalysis)
    positioning = audience
      ? `Target "${nicheAnalysis.bestKeyword}" — specifically for ${audience} who find existing broad solutions poorly fit`
      : `Target "${nicheAnalysis.bestKeyword}" — avoid competing with the broad market`;
  else if (decision === 'proceed')
    positioning = audience
      ? `Enter as the clearer, more focused option for ${audience} — avoid copying the broad market playbook`
      : 'Enter as the simpler, more accessible option for underserved users';
  else
    positioning = 'Find a specific user segment that is underserved by existing solutions';

  let differentiation: string;
  if (problem && topCluster)
    differentiation = topCluster === 'pricing'
      ? `Your stated pain ("${problem.slice(0, 60)}") aligns with the top pricing complaint — lead with transparent or one-time pricing`
      : topCluster === 'ux'
        ? `Your stated pain ("${problem.slice(0, 60)}") maps to the top UX complaint cluster — lead with simplicity`
        : `Your stated pain ("${problem.slice(0, 60)}") maps to the top complaint cluster — lead with this as your differentiator`;
  else if (topCluster === 'pricing')
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
    { label: 'Positioning',     text: positioning },
    { label: 'Differentiation', text: differentiation },
    { label: 'Goal',            text: goal },
  ];
}

export function buildQuantifiedWinSignals(result: EnhancedValidationResult, ideaCtx?: IdeaContext): string[] {
  const clusters = result.painAnalysis?.topPainClusters ?? [];
  const idea     = ideaCtx ? truncate(ideaCtx.description) : null;
  const audience = ideaCtx?.audience ?? null;

  if (clusters.length > 0) {
    return clusters.slice(0, 3).map(({ cluster, share }) => {
      const s = share >= 75 ? `~${share}%` : `${share}%`;
      switch (cluster) {
        case 'ux':               return idea
          ? `UX complaints in ${s} of signals → ${idea} can win by prioritizing simplicity over feature breadth`
          : `UX/usability complaints in ${s} of signals → simplify onboarding to convert frustrated users`;
        case 'pricing':          return audience
          ? `Pricing frustration in ${s} of signals → ${audience} would switch to a fairer or one-time pricing model`
          : `Pricing frustration in ${s} of signals → offer transparent or one-time pricing to win defectors`;
        case 'missing_features': return idea
          ? `Feature gap in ${s} of signals → ${idea} can capture these users by shipping the workflow incumbents ignore`
          : `Feature gap in ${s} of signals → ship the workflow incumbents have ignored`;
        case 'performance':      return idea
          ? `Performance issues in ${s} of signals → ${idea} can differentiate on speed and reliability`
          : `Performance issues in ${s} of signals → prioritize speed and reliability as a core differentiator`;
        case 'bugs':             return idea
          ? `Stability complaints in ${s} of signals → ${idea} can build brand trust around reliability`
          : `Stability complaints in ${s} of signals → reliability as a brand promise creates switching incentive`;
        default:                 return `${cluster} issues in ${s} of signals`;
      }
    });
  }
  return result.opportunityInsights ?? [];
}

export function buildScoreExplanation(
  metric: 'competition' | 'pain' | 'opportunity',
  score: number,
  result: EnhancedValidationResult,
  ideaCtx?: IdeaContext,
): string {
  const level    = getLevel(score);
  const idea     = ideaCtx ? truncate(ideaCtx.description) : null;
  const audience = ideaCtx?.audience ?? null;
  const problem  = ideaCtx?.problem ?? null;

  if (metric === 'competition') {
    if (level === 'HIGH') return idea
      ? `Saturated — ${idea} competes against established apps with 4.7★ and 100k+ reviews from day one`
      : 'Saturated — competing on features alone will not work here';
    if (level === 'MEDIUM') return 'Crowded but not closed — a focused angle can still break through';
    return 'Low competition — the gap is real and reachable for a new entrant';
  }
  if (metric === 'pain') {
    if (level === 'HIGH') return audience
      ? `${audience} are actively frustrated — demand for something better is validated`
      : 'Real user frustration detected — demand for a better solution is validated';
    if (level === 'MEDIUM') return "Pain exists but isn't acute — validate the problem before building";
    return idea
      ? `Low signals — find a specific underserved segment before building ${idea}`
      : 'Low demand signals — find a specific underserved segment before building';
  }
  const isNiche = result.bestEntryStrategy === 'ENTER_VIA_NICHE';
  if (level === 'HIGH') return isNiche ? 'Niche entry has a strong viable path' : 'Market gap is real — move before it closes';
  if (level === 'MEDIUM') return problem
    ? `Viable with focus — "${problem.slice(0, 50)}" can be a differentiator if targeted narrowly`
    : "Viable with the right positioning — don't enter broad";
  return 'Limited opportunity in broad market — niche or pivot required';
}

interface Refinement {
  type: 'Positioning' | 'Audience' | 'Feature';
  title: string;
  reason: string;
}

export function buildRefinements(result: EnhancedValidationResult, ideaCtx?: IdeaContext): Refinement[] {
  const refinements: Refinement[] = [];
  const { bestEntryStrategy, nicheAnalysis, painAnalysis, competitorInsights, whereToWin } = result;
  const topCluster = painAnalysis?.topPainClusters?.[0];
  const topCI      = competitorInsights?.[0];
  const audience   = ideaCtx?.audience;
  const idea       = ideaCtx ? truncate(ideaCtx.description, 50) : 'your idea';

  if (bestEntryStrategy === 'ENTER_VIA_NICHE' && nicheAnalysis) {
    const note = nicheAnalysis.comparisonNote ?? 'this sub-market shows materially lower competition';
    refinements.push({
      type: 'Positioning',
      title: `Reposition around "${nicheAnalysis.bestKeyword}"`,
      reason: `The broad market is too crowded — "${nicheAnalysis.bestKeyword}" shows lower competition. ${note}`,
    });
  }

  if (topCluster) {
    const clusterMap: Record<string, { title: string; reason: (idea: string, share: number, audience?: string) => string }> = {
      pricing:          { title: 'Lead with transparent or one-time pricing',              reason: (i, s, a) => `${s}% of user signals cite pricing frustration — ${i} can win the segment that's priced out of incumbents${a ? ` (${a})` : ''}` },
      ux:               { title: 'Cut onboarding to under 2 minutes',                      reason: (i, s, a) => `${s}% of signals cite complexity — ${a ?? 'users'} are abandoning incumbents over friction; ${i} can win by being the simple option` },
      missing_features: { title: "Build the workflow feature competitors haven't shipped", reason: (i, s)    => `${s}% of signals request features incumbents have ignored — first to ship captures these users for ${i}` },
      performance:      { title: 'Make speed your brand promise',                          reason: (i, s)    => `${s}% of signals mention performance issues — ${i} can own reliability as a core differentiator` },
      bugs:             { title: 'Brand around stability and reliability',                 reason: (i, s)    => `${s}% of signals cite bugs — a stable alternative creates real switching incentive for ${i}` },
    };
    const entry = clusterMap[topCluster.cluster];
    if (entry)
      refinements.push({ type: 'Feature', title: entry.title, reason: entry.reason(idea, topCluster.share, audience) });
  }

  if (topCI?.weakness && refinements.length < 3)
    refinements.push({
      type: 'Feature',
      title: `Fix what ${topCI.name} gets wrong: ${topCI.weakness}`,
      reason: `${topCI.name} has strong adoption but fails on "${topCI.weakness}" — ${idea} can win users who are actively frustrated by this gap`,
    });

  if (refinements.length < 2) {
    const winTarget = whereToWin?.[0];
    if (winTarget?.opportunity)
      refinements.push({
        type: 'Audience',
        title: winTarget.opportunity.length > 65 ? winTarget.opportunity.slice(0, 65).replace(/\s\S*$/, '') + '…' : winTarget.opportunity,
        reason: winTarget.gap ?? 'A specific audience reduces competition surface and makes your pitch sharper',
      });
  }

  return refinements.slice(0, 3);
}

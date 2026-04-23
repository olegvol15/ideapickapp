import { cap } from './scores';
import type { EnhancedValidationResult } from '@/lib/schemas';

export type SuggestionType = 'Positioning' | 'Audience' | 'Feature';

export interface Suggestion {
  type: SuggestionType;
  title: string;
  reason: string;
  keywords: string[];
}

export interface InputHints {
  product: string;
  audience: string;
  coreValue: string;
}

const CLUSTER_AUDIENCE: Record<string, string[]> = {
  ux:               ['ADHD users', 'non-technical founders', 'overwhelmed beginners'],
  pricing:          ['solopreneurs', 'students', 'bootstrapped founders', 'freelancers'],
  missing_features: ['power users', 'team leads', 'professionals'],
  performance:      ['mobile-first users', 'low-bandwidth markets', 'field workers'],
  bugs:             ['enterprise teams', 'data-sensitive users', 'regulated industries'],
};

const CLUSTER_FEATURE: Record<string, string[]> = {
  ux:               ['2-min onboarding', 'no learning curve', 'mobile-first'],
  pricing:          ['pay once', 'no subscription', 'free forever tier'],
  missing_features: ['automation', 'bulk actions', 'integrations'],
  performance:      ['instant load', 'offline mode', 'lightweight'],
  bugs:             ['99.9% uptime', 'data export', 'rollback support'],
};

const CLUSTER_POSITIONING: Record<string, string[]> = {
  ux:               ['simplified', 'no-setup', 'frictionless'],
  pricing:          ['one-time purchase', 'transparent pricing', 'no lock-in'],
  missing_features: ['workflow-first', 'automation-ready', 'integration-native'],
  performance:      ['lightweight', 'fast', 'offline-first'],
  bugs:             ['stable', 'reliable', 'battle-tested'],
};

function buildKeywords(type: SuggestionType, result: EnhancedValidationResult): string[] {
  const niche      = result.nicheAnalysis?.bestKeyword ?? '';
  const topCluster = result.painAnalysis?.topPainClusters?.[0]?.cluster;
  const ci         = result.competitorInsights?.[0];
  const win        = result.whereToWin?.[0];

  if (type === 'Positioning') {
    const nicheTerms   = niche.split(/\s+/).filter((w) => w.length > 3).slice(0, 2);
    const clusterTerms = topCluster ? (CLUSTER_POSITIONING[topCluster] ?? []).slice(0, 2) : [];
    return [...nicheTerms, ...clusterTerms].slice(0, 4);
  }

  if (type === 'Audience') {
    const clusterKws = topCluster ? (CLUSTER_AUDIENCE[topCluster] ?? []).slice(0, 3) : [];
    const winTerms   = win?.opportunity
      ? win.opportunity.split(/[\s,]+/).filter((w) => w.length > 5 && /^[a-z]/i.test(w)).slice(0, 2)
      : [];
    return [...clusterKws, ...winTerms].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
  }

  // Feature
  if (ci?.weakness) {
    const weaknessTerms = ci.weakness.split(/\s+/).slice(0, 3);
    return [`without ${weaknessTerms.join(' ')}`.slice(0, 30)].slice(0, 3);
  }
  return topCluster ? (CLUSTER_FEATURE[topCluster] ?? []).slice(0, 4) : [];
}

export function buildSuggestions(result: EnhancedValidationResult): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const topCluster  = result.painAnalysis?.topPainClusters?.[0];
  const ci          = result.competitorInsights?.[0];
  const winAudience = result.whereToWin?.find((w) => /segment|niche|audience|trust/i.test(w.title));
  const winAny      = result.whereToWin?.[0];
  const winTarget   = winAudience ?? winAny;

  if (result.nicheAnalysis?.bestKeyword && result.bestEntryStrategy === 'ENTER_VIA_NICHE') {
    const niche = result.nicheAnalysis.bestKeyword;
    suggestions.push({
      type: 'Positioning',
      title: `Reposition around "${niche}"`,
      reason: `This sub-market has materially lower competition — lead with it in your description`,
      keywords: buildKeywords('Positioning', result),
    });
  }

  if (winTarget?.opportunity) {
    const cleaned = winTarget.opportunity
      .replace(/^target\s+/i, '').replace(/^focus on\s+/i, '').replace(/\.$/, '').toLowerCase();
    suggestions.push({
      type: 'Audience',
      title: `Narrow to: ${cleaned.length > 55 ? cleaned.slice(0, 55).trimEnd() + '…' : cleaned}`,
      reason: winTarget.gap ?? 'A specific audience reduces competition surface and makes your pitch sharper',
      keywords: buildKeywords('Audience', result),
    });
  } else if (topCluster) {
    const segmentLabel = (CLUSTER_AUDIENCE[topCluster.cluster] ?? ['a specific underserved segment'])[0];
    suggestions.push({
      type: 'Audience',
      title: `Target ${segmentLabel}`,
      reason: `${topCluster.share}% of signals mention ${topCluster.cluster.replace('_', ' ')} — these users are actively looking for an alternative`,
      keywords: buildKeywords('Audience', result),
    });
  }

  if (ci?.weakness) {
    suggestions.push({
      type: 'Feature',
      title: `Fix what ${ci.name} gets wrong`,
      reason: `${ci.name} consistently fails at: ${ci.weakness}. Users are actively looking for an alternative.`,
      keywords: buildKeywords('Feature', result),
    });
  } else if (topCluster) {
    const featureLabelMap: Record<string, string> = {
      pricing:          'transparent pay-once pricing',
      ux:               'onboarding under 2 minutes',
      missing_features: 'the workflow features others ignore',
      performance:      'speed on any device',
      bugs:             'a stable, reliable core',
    };
    const label = featureLabelMap[topCluster.cluster] ?? 'a key gap competitors miss';
    suggestions.push({
      type: 'Feature',
      title: `Lead with ${label}`,
      reason: `${topCluster.share}% of user signals cite ${topCluster.cluster.replace('_', ' ')} complaints — this is an open, exploitable gap`,
      keywords: buildKeywords('Feature', result),
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'Audience',
      title: 'Narrow to a specific underserved segment',
      reason: 'The broad market is too competitive — a focused audience reduces competition surface',
      keywords: ['solopreneurs', 'bootstrapped founders', 'non-technical users'],
    });
  }

  return suggestions.slice(0, 3);
}

export function buildInputHints(result: EnhancedValidationResult): InputHints {
  const niche      = result.nicheAnalysis?.bestKeyword;
  const topCluster = result.painAnalysis?.topPainClusters?.[0];
  const ci         = result.competitorInsights?.[0];
  const winTarget  = result.whereToWin?.find((w) => /segment|niche|audience/i.test(w.title)) ?? result.whereToWin?.[0];

  const product = niche
    ? `e.g. "${cap(niche)} — [your description]"`
    : 'What are you building?';

  let audience = 'Who is it for? (optional)';
  if (winTarget?.opportunity) {
    const cleaned = winTarget.opportunity.replace(/^target\s+/i, '').replace(/\.$/, '').toLowerCase();
    audience = `e.g. ${cleaned.length > 55 ? cleaned.slice(0, 55) + '…' : cleaned}`;
  } else if (topCluster?.cluster === 'ux')             audience = 'e.g. ADHD users frustrated by complex apps';
  else if (topCluster?.cluster === 'pricing')          audience = 'e.g. solopreneurs looking for pay-once tools';
  else if (topCluster?.cluster === 'missing_features') audience = "e.g. power users whose workflow isn't supported";
  else if (niche)                                      audience = `e.g. people searching for "${niche}"`;

  let coreValue = 'What makes it different? (optional)';
  if (topCluster?.cluster === 'pricing')               coreValue = 'e.g. transparent pricing, no hidden fees';
  else if (topCluster?.cluster === 'ux')               coreValue = 'e.g. onboarding under 2 minutes, no learning curve';
  else if (topCluster?.cluster === 'missing_features') coreValue = 'e.g. the workflow features incumbents ignore';
  else if (topCluster?.cluster === 'performance')      coreValue = 'e.g. fast even on low-end devices';
  else if (ci?.weakness)                               coreValue = `e.g. without ${ci.weakness.toLowerCase().replace(/\.$/, '')}`;

  return { product, audience, coreValue };
}

export function reconstruct(product: string, audience: string, coreValue: string): string {
  const p = product.trim();
  const a = audience.trim();
  const c = coreValue.trim();
  if (!a && !c) return p;
  if (a && !c)  return `${p} for ${a}`;
  if (!a && c)  return `${p} — ${c}`;
  return `${p} for ${a} — ${c}`;
}

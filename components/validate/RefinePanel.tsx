'use client';

import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { EnhancedValidationResult } from '@/lib/schemas';

interface RefinePanelProps {
  description: string;
  result: EnhancedValidationResult;
  version: number;
  isLoading: boolean;
  onRevalidate: (newDescription: string) => void;
}

type SuggestionType = 'Positioning' | 'Audience' | 'Feature';

interface Suggestion {
  type: SuggestionType;
  title: string;
  reason: string;
  keywords: string[]; // concrete, short, actionable terms
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── Keyword generation ───────────────────────────────────────────────────────

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
    const nicheTerms = niche.split(/\s+/).filter((w) => w.length > 3).slice(0, 2);
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

// ─── Suggestions ─────────────────────────────────────────────────────────────

function buildSuggestions(result: EnhancedValidationResult): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const topCluster = result.painAnalysis?.topPainClusters?.[0];
  const ci         = result.competitorInsights?.[0];
  const winAudience = result.whereToWin?.find((w) => /segment|niche|audience|trust/i.test(w.title));
  const winAny      = result.whereToWin?.[0];
  const winTarget   = winAudience ?? winAny;

  // 1. Positioning — niche market angle
  if (result.nicheAnalysis?.bestKeyword && result.bestEntryStrategy === 'ENTER_VIA_NICHE') {
    const niche = result.nicheAnalysis.bestKeyword;
    suggestions.push({
      type: 'Positioning',
      title: `Reposition around "${niche}"`,
      reason: `This sub-market has materially lower competition — lead with it in your description`,
      keywords: buildKeywords('Positioning', result),
    });
  }

  // 2. Audience — real segment derived from data
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

  // 3. Feature — competitor gap or pain cluster
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

  // Fallback
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

// ─── Smart placeholders ───────────────────────────────────────────────────────

interface InputHints { product: string; audience: string; coreValue: string; }

function buildInputHints(result: EnhancedValidationResult): InputHints {
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
  else if (topCluster?.cluster === 'missing_features') audience = 'e.g. power users whose workflow isn\'t supported';
  else if (niche)                                      audience = `e.g. people searching for "${niche}"`;

  let coreValue = 'What makes it different? (optional)';
  if (topCluster?.cluster === 'pricing')              coreValue = 'e.g. transparent pricing, no hidden fees';
  else if (topCluster?.cluster === 'ux')              coreValue = 'e.g. onboarding under 2 minutes, no learning curve';
  else if (topCluster?.cluster === 'missing_features') coreValue = 'e.g. the workflow features incumbents ignore';
  else if (topCluster?.cluster === 'performance')     coreValue = 'e.g. fast even on low-end devices';
  else if (ci?.weakness)                              coreValue = `e.g. without ${ci.weakness.toLowerCase().replace(/\.$/, '')}`;

  return { product, audience, coreValue };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function reconstruct(product: string, audience: string, coreValue: string): string {
  const p = product.trim();
  const a = audience.trim();
  const c = coreValue.trim();
  if (!a && !c) return p;
  if (a && !c)  return `${p} for ${a}`;
  if (!a && c)  return `${p} — ${c}`;
  return `${p} for ${a} — ${c}`;
}

const TYPE_STYLE: Record<SuggestionType, string> = {
  Positioning: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Audience:    'bg-blue-500/10   text-blue-400   border-blue-500/20',
  Feature:     'bg-amber-500/10  text-amber-400  border-amber-500/20',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RefinePanel({ description, result, version, isLoading, onRevalidate }: RefinePanelProps) {
  const suggestions     = buildSuggestions(result);
  const hints           = buildInputHints(result);

  const [product, setProduct]     = useState(description);
  const [audience, setAudience]   = useState('');
  const [coreValue, setCoreValue] = useState('');

  const afterText  = reconstruct(product, audience, coreValue);
  const hasChanges = product.trim() !== description.trim() || !!audience.trim() || !!coreValue.trim();

  function reset() { setProduct(description); setAudience(''); setCoreValue(''); }

  return (
    <div className="mt-3 rounded-xl border border-border bg-card px-6 py-5 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Refine Idea</p>
        {version > 1 && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground/75">
            Version {version}
          </span>
        )}
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Edit idea</p>
          {hasChanges && (
            <button type="button" onClick={reset}
              className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        {/* Product */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 mb-1">Product</span>
          <Textarea
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder={hints.product}
            className="text-sm resize-none min-h-[120px]"
            rows={4}
          />
        </div>

        {/* Audience */}
        <div className="grid grid-cols-[80px_1fr] items-start gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 text-right pr-1 pt-2">Audience</span>
          <div>
            <Textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder={hints.audience}
              className="text-sm resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Core value */}
        <div className="grid grid-cols-[80px_1fr] items-start gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 text-right pr-1 pt-2">Core value</span>
          <div>
            <Textarea
              value={coreValue}
              onChange={(e) => setCoreValue(e.target.value)}
              placeholder={hints.coreValue}
              className="text-sm resize-none"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Improved version preview */}
      {hasChanges && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] overflow-hidden">
          <div className="px-4 py-2 border-b border-emerald-500/15">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Improved version</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-foreground/90 leading-snug">{afterText}</p>
            {afterText !== description && (
              <p className="text-[11px] text-muted-foreground/45 mt-2 leading-snug line-clamp-1">
                was: {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between gap-3">
        <span />
        <Button
          className={cn('justify-between gap-2', !hasChanges && 'opacity-50')}
          disabled={isLoading || !product.trim()}
          onClick={() => onRevalidate(afterText)}
        >
          {isLoading ? 'Validating…' : 'Test this version'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Ways to improve */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-1 border-t border-border/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Ways to improve</p>
          {suggestions.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/15 px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0', TYPE_STYLE[s.type])}>
                  {s.type}
                </span>
                <span className="text-sm font-semibold text-foreground/90 leading-snug">{s.title}</span>
              </div>
              <p className="text-xs text-muted-foreground/65 leading-snug">{s.reason}</p>
              {s.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {s.keywords.map((kw) => (
                    <span key={kw} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground/75 border border-border/60">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

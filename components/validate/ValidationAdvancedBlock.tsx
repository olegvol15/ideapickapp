'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClass, scoreColor, type Tone } from '@/lib/validate/colors';
import { buildNicheWhyBullets, cap } from '@/lib/validate/scores';
import { CompetitorLogo } from '@/components/market/competitors-list/CompetitorLogo';
import { SectionHeading } from './SectionHeading';
import { CompareRow } from './CompareRow';
import { ScoreBreakdownRow } from './ScoreBreakdownRow';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

interface ValidationAdvancedBlockProps {
  result: EnhancedValidationResult;
  competitors: Competitor[];
}

export function ValidationAdvancedBlock({
  result,
  competitors,
}: ValidationAdvancedBlockProps) {
  const [open, setOpen] = useState(false);

  const {
    competitionScore,
    opportunityScore,
    scoreBreakdown,
    willingnessToPay,
    evidencedSignals,
    signals,
    nicheAnalysis,
    rawScores,
    metrics,
    bestEntryStrategy,
    marketInsights,
    evidenceQuality,
    keywordMarkets,
  } = result;

  const signalItems = competitors
    .filter((c) => c.type === 'signal')
    .slice(0, 4);
  const competitorItems = competitors
    .filter((c) => c.type !== 'signal')
    .slice(0, 5);

  const allEvidence =
    evidencedSignals && evidencedSignals.length > 0
      ? [...evidencedSignals].sort(
          (a, b) =>
            ({ strong: 0, moderate: 1, weak: 2 })[a.strength] -
            { strong: 0, moderate: 1, weak: 2 }[b.strength]
        )
      : signals
          .slice(0, 5)
          .map((s) => ({ text: s, strength: 'moderate' as const }));

  const compColor: Tone =
    competitionScore >= 70
      ? 'rose'
      : competitionScore >= 40
        ? 'amber'
        : 'emerald';
  const detailedBreakdown =
    scoreBreakdown?.pain &&
    scoreBreakdown?.competition &&
    scoreBreakdown?.opportunity
      ? [
          {
            title: 'Pain',
            total: result.painScore,
            tone: scoreColor(result.painScore),
            items: scoreBreakdown.pain,
          },
          {
            title: 'Competition',
            total: competitionScore,
            tone: compColor,
            items: scoreBreakdown.competition,
          },
          {
            title: 'Opportunity',
            total: opportunityScore,
            tone: scoreColor(opportunityScore),
            items: scoreBreakdown.opportunity,
          },
        ]
      : null;

  const hasNicheComparison = !!(
    nicheAnalysis && bestEntryStrategy === 'ENTER_VIA_NICHE'
  );
  const nicheWhyBullets = hasNicheComparison
    ? buildNicheWhyBullets(nicheAnalysis!, rawScores, metrics)
    : [];
  const baseComp = rawScores?.competitionScore ?? 0;
  const baseOpp = rawScores?.opportunityScore ?? 0;
  const nicheComp = nicheAnalysis?.bestKeywordScores.competitionScore ?? 0;
  const nicheOpp = nicheAnalysis?.bestKeywordScores.opportunityScore ?? 0;

  const hasContent = !!(
    competitorItems.length ||
    signalItems.length ||
    detailedBreakdown ||
    willingnessToPay ||
    allEvidence.length ||
    evidenceQuality ||
    (keywordMarkets && keywordMarkets.length > 0) ||
    (marketInsights && marketInsights.length > 0)
  );
  if (!hasContent) return null;

  return (
    <div className="border-t border-border/30 pt-8 pb-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-1 hover:opacity-70 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <SectionHeading>Advanced analysis</SectionHeading>
          <span className="text-xs text-muted-foreground/45 -mt-[2px]">
            breakdown · evidence · sources
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground/50" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
        )}
      </button>

      {open && (
        <div className="pt-6 flex flex-col gap-6">
          {detailedBreakdown && (
            <div className="flex flex-col gap-5">
              <SectionHeading>Score breakdown</SectionHeading>
              {detailedBreakdown.map((group) => (
                <div key={group.title} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 w-24">
                      {group.title}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-semibold tabular-nums',
                        colorClass(group.tone, 'text')
                      )}
                    >
                      {group.total}
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

          {willingnessToPay && (
            <div
              className={cn(
                'flex flex-col gap-3',
                detailedBreakdown && 'border-t border-border pt-5'
              )}
            >
              <SectionHeading>Willingness to Pay</SectionHeading>
              <span
                className={cn(
                  'text-2xl font-bold leading-none',
                  willingnessToPay.level === 'high'
                    ? 'text-emerald-500'
                    : willingnessToPay.level === 'medium'
                      ? 'text-amber-500'
                      : 'text-rose-500'
                )}
              >
                {cap(willingnessToPay.level)}
              </span>
              <div className="flex flex-col gap-2">
                {willingnessToPay.freeSubstitutes && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Free alternatives
                    </span>
                    <span className="text-sm text-foreground/75 leading-snug">
                      {willingnessToPay.freeSubstitutes}
                    </span>
                  </div>
                )}
                {willingnessToPay.paidAlternatives && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Paid alternatives
                    </span>
                    <span className="text-sm text-foreground/75 leading-snug">
                      {willingnessToPay.paidAlternatives}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasNicheComparison && nicheAnalysis && (
            <div className="border-t border-border pt-5 flex flex-col gap-3">
              <SectionHeading>Niche vs broad market</SectionHeading>
              <p className="text-xs font-semibold text-foreground/80">
                &ldquo;{nicheAnalysis.bestKeyword}&rdquo;
              </p>
              {nicheWhyBullets.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {nicheWhyBullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-foreground/75 leading-snug"
                    >
                      <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-1.5 mt-1">
                <CompareRow
                  label="Competition"
                  base={baseComp}
                  niche={nicheComp}
                  lowerBetter
                />
                <CompareRow
                  label="Opportunity"
                  base={baseOpp}
                  niche={nicheOpp}
                  lowerBetter={false}
                />
              </div>
            </div>
          )}

          {marketInsights && marketInsights.length > 0 && (
            <div className="border-t border-border pt-5 flex flex-col gap-3">
              <SectionHeading>Market data</SectionHeading>
              <ul className="flex flex-col gap-1.5">
                {marketInsights.map((insight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-foreground/70 leading-snug"
                  >
                    <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(evidenceQuality || (keywordMarkets && keywordMarkets.length > 0)) && (
            <div className="border-t border-border pt-5 flex flex-col gap-3">
              <SectionHeading>Evidence quality</SectionHeading>
              {evidenceQuality && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: 'Relevant apps', value: evidenceQuality.relevantApps },
                    { label: 'Raw apps', value: evidenceQuality.rawApps },
                    { label: 'Reviews read', value: evidenceQuality.reviewsAnalyzed },
                    { label: 'Keyword fit', value: `${evidenceQuality.keywordRelevance}%` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-border bg-muted/10 px-3 py-2"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-foreground/85">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {keywordMarkets && keywordMarkets.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {keywordMarkets.slice(0, 5).map((market) => (
                    <div
                      key={market.keyword}
                      className="grid grid-cols-[minmax(0,1fr)_56px_56px] gap-2 text-xs text-foreground/70"
                    >
                      <span className="truncate">&ldquo;{market.keyword}&rdquo;</span>
                      <span className="text-right tabular-nums">
                        {market.relevantAppCount}/{market.rawAppCount} apps
                      </span>
                      <span className="text-right tabular-nums">
                        {market.relevanceScore}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {evidenceQuality && evidenceQuality.limitations.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {evidenceQuality.limitations.map((limitation) => (
                    <li
                      key={limitation}
                      className="flex items-start gap-2 text-xs text-amber-500/85 leading-snug"
                    >
                      <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                      {limitation}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(allEvidence.length > 0 || signalItems.length > 0) && (
            <div className="border-t border-border pt-5 grid gap-5 sm:grid-cols-2">
              {allEvidence.length > 0 && (
                <div>
                  <SectionHeading>Evidence signals</SectionHeading>
                  <ul className="mt-3 flex flex-col gap-2">
                    {allEvidence.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-foreground/80 leading-snug"
                      >
                        <span
                          className={cn(
                            'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full',
                            s.strength === 'strong'
                              ? 'bg-emerald-500'
                              : s.strength === 'moderate'
                                ? 'bg-amber-500/70'
                                : 'bg-muted-foreground/50'
                          )}
                        />
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
  );
}

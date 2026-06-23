'use client';

import { useState } from 'react';
import { CompetitorInsightBlock } from './CompetitorInsightBlock';
import { IdyAssessment } from './IdyAssessment';
import { normalizeCompetitorBullets } from '@/lib/validate/legacy';
import { PainScoreBlock } from './PainScoreBlock';
import { PainThemeBlock } from './PainThemeBlock';
import { SectionHeading } from './SectionHeading';
import {
  evidenceTypeCounts,
  matchedSourceCounts,
} from '@/lib/evidence/quote-pool';
import { capitalizeFirst } from '@/lib/utils';
import type { PainEvidenceResult } from '@/lib/schemas';

interface ValidationReportProps {
  result: PainEvidenceResult;
  title?: string;
  revealId?: string;
}

export function ValidationReport({
  result,
  title,
  revealId,
}: ValidationReportProps) {
  const [relatedOpen, setRelatedOpen] = useState(false);
  const hasEvidence = result.themes.length > 0;
  const evidenceCounts = evidenceTypeCounts(result);
  const sourceCounts = matchedSourceCounts(result);
  const stats = [
    `${result.totalQuotes} mention${result.totalQuotes !== 1 ? 's' : ''}`,
    evidenceCounts.complaint > 0 &&
      `${evidenceCounts.complaint} complaint${evidenceCounts.complaint !== 1 ? 's' : ''}`,
    evidenceCounts.related > 0 && `${evidenceCounts.related} related`,
    result.themes.length > 0 &&
      `${result.themes.length} theme${result.themes.length !== 1 ? 's' : ''}`,
    sourceCounts.reddit > 0 && `${sourceCounts.reddit} Reddit`,
    sourceCounts.web > 0 && `${sourceCounts.web} forum/web`,
    sourceCounts.appstore > 0 && `${sourceCounts.appstore} App Store`,
  ].filter(Boolean) as string[];
  const complaintThemes = result.themes.filter(
    (theme) => theme.evidenceType !== 'related'
  );
  const relatedThemes = result.themes.filter(
    (theme) => theme.evidenceType === 'related'
  );
  const relatedQuoteCount = relatedThemes.reduce(
    (sum, theme) => sum + theme.quotes.length,
    0
  );
  const competitors = result.competitors ?? [];

  const formattedTitle = title ? capitalizeFirst(title) : '';

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="space-y-6">
        {title && (
          <h1 className="text-center text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {formattedTitle}
          </h1>
        )}
        {result.assessment && (
          <IdyAssessment
            assessment={result.assessment}
            score={result.score}
            revealId={revealId}
          />
        )}
        {result.score != null && (
          <PainScoreBlock
            score={result.score}
            breakdown={result.scoreBreakdown}
          />
        )}
        <p className="text-[15px] leading-relaxed text-foreground/85">
          {result.summary}
        </p>
        {result.totalQuotes > 0 && (
          <div className="flex flex-wrap gap-2">
            {stats.map((stat) => (
              <span
                key={stat}
                className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs tabular-nums text-muted-foreground/70"
              >
                {stat}
              </span>
            ))}
          </div>
        )}
        {result.problem && (
          <p className="text-xs text-muted-foreground/50">
            Searched for:{' '}
            <span className="text-muted-foreground/75">
              &ldquo;{result.problem}&rdquo;
            </span>
          </p>
        )}
      </header>

      {hasEvidence ? (
        <>
          {complaintThemes.length > 0 && (
            <div className="flex flex-col gap-6">
              <SectionHeading>Direct Complaints</SectionHeading>
              {complaintThemes.map((theme) => (
                <PainThemeBlock key={theme.label} theme={theme} />
              ))}
            </div>
          )}
          {relatedThemes.length > 0 && (
            <div className="mt-4 flex flex-col gap-6 border-t border-border/50 pt-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionHeading>Related Context</SectionHeading>
                  <p className="mt-2 text-sm text-muted-foreground/60">
                    {relatedQuoteCount} relevant excerpt
                    {relatedQuoteCount !== 1 ? 's' : ''} covering workflows,
                    workarounds, questions, and discussions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRelatedOpen((value) => !value)}
                  className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/75 transition-colors hover:bg-muted/50 hover:text-foreground"
                  aria-expanded={relatedOpen}
                >
                  {relatedOpen ? 'Hide related' : `Show related (${relatedQuoteCount})`}
                </button>
              </div>
              {relatedOpen &&
                relatedThemes.map((theme) => (
                  <PainThemeBlock key={theme.label} theme={theme} />
                ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            {result.totalQuotes > 0
              ? 'No relevant complaints matched'
              : 'No public complaints found'}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {result.totalQuotes > 0
              ? `We collected ${result.totalQuotes} excerpts, but none were reliable complaints about “${result.problem}”. Try narrowing or rewording the problem.`
              : `We searched for “${result.problem}” and found no real complaints. That itself is a signal — either the pain is rare, or people describe it differently. Try rewording the problem and validating again.`}
          </p>
        </div>
      )}

      {competitors.length > 0 && (
        <div className="mt-4 flex flex-col gap-4 border-t border-border/50 pt-8">
          <SectionHeading>Competitors</SectionHeading>
          <div className="grid items-start gap-3 sm:grid-cols-2">
            {competitors.map((competitor, index) => (
              <CompetitorInsightBlock
                key={`${competitor.name}-${index}`}
                competitor={{
                  ...competitor,
                  likes: normalizeCompetitorBullets(competitor.likes),
                  dislikes: normalizeCompetitorBullets(competitor.dislikes),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

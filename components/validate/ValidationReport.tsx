'use client';

import { useState } from 'react';
import { PainThemeBlock } from './PainThemeBlock';
import { SectionHeading } from './SectionHeading';
import {
  evidenceTypeCounts,
  matchedQuoteCount,
  matchedSourceCounts,
} from '@/lib/evidence/quote-pool';
import type { PainEvidenceResult } from '@/lib/schemas';

interface ValidationReportProps {
  result: PainEvidenceResult;
  title?: string;
}

export function ValidationReport({ result, title }: ValidationReportProps) {
  const [relatedOpen, setRelatedOpen] = useState(false);
  const hasEvidence = result.themes.length > 0;
  const matchedQuotes = matchedQuoteCount(result);
  const evidenceCounts = evidenceTypeCounts(result);
  const sourceCounts = matchedSourceCounts(result);
  const sourceSummary = [
    sourceCounts.reddit > 0 ? `${sourceCounts.reddit} Reddit` : null,
    sourceCounts.web > 0 ? `${sourceCounts.web} forum/web` : null,
    sourceCounts.appstore > 0 ? `${sourceCounts.appstore} App Store` : null,
  ]
    .filter(Boolean)
    .join(' · ');
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

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="space-y-3">
        <SectionHeading>Pain Evidence</SectionHeading>
        {title && (
          <h1 className="text-2xl font-bold leading-snug tracking-tight text-foreground">
            {title}
          </h1>
        )}
        <p className="text-[15px] leading-relaxed text-foreground/85">
          {result.summary}
        </p>
        {result.totalQuotes > 0 && (
          <p className="text-xs text-muted-foreground/60">
            {result.totalQuotes} excerpt{result.totalQuotes !== 1 ? 's' : ''}{' '}
            reviewed · {evidenceCounts.complaint} complaint
            {evidenceCounts.complaint !== 1 ? 's' : ''} ·{' '}
            {evidenceCounts.related} related · {matchedQuotes} shown ·{' '}
            {result.themes.length} theme
            {result.themes.length !== 1 ? 's' : ''} · searched for: &ldquo;
            {result.problem}&rdquo;
          </p>
        )}
        {sourceSummary && (
          <p className="text-xs text-muted-foreground/45">
            Matched source mix: {sourceSummary}
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
    </div>
  );
}

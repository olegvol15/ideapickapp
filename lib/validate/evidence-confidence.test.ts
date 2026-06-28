import { describe, expect, it } from 'vitest';
import type { PainEvidenceResult, PainQuote, PainTheme } from '@/lib/schemas';
import { computeEvidenceConfidence } from './evidence-confidence';

function quote(overrides: Partial<PainQuote> = {}): PainQuote {
  return {
    text: 'A complaint about the problem.',
    source: 'reddit',
    sourceLabel: 'Reddit r/testing',
    ...overrides,
  };
}

function theme(quotes: PainQuote[], evidenceType: PainTheme['evidenceType'] = 'complaint'): PainTheme {
  return { label: 'A theme', evidenceType, mentionCount: quotes.length, quotes };
}

function result(themes: PainTheme[], competitors?: PainEvidenceResult['competitors']): PainEvidenceResult {
  return {
    problem: 'A test problem',
    summary: 'summary',
    totalQuotes: themes.reduce((n, t) => n + t.quotes.length, 0),
    themes,
    competitors,
  };
}

describe('computeEvidenceConfidence', () => {
  it('counts distinct sources and contributing source kinds', () => {
    const confidence = computeEvidenceConfidence(
      result([
        theme([
          quote({ source: 'reddit', sourceLabel: 'Reddit r/a' }),
          quote({ source: 'web', sourceLabel: 'example.com' }),
          quote({ source: 'appstore', sourceLabel: 'App Store, X' }),
        ]),
      ])
    );

    expect(confidence.distinctSources).toBe(3);
    expect(confidence.sourceKinds).toBe(3);
    expect(confidence.excerptsReviewed).toBe(3);
  });

  it('rates broad, multi-source, competitor-backed evidence as high', () => {
    const quotes = Array.from({ length: 8 }, (_, i) =>
      quote({ source: i % 2 ? 'web' : 'reddit', sourceLabel: `src-${i}` })
    );
    const confidence = computeEvidenceConfidence(
      result(
        [theme(quotes.slice(0, 3)), theme(quotes.slice(3, 6)), theme(quotes.slice(6))],
        [
          {
            name: 'Rival',
            description: 'd',
            likes: [],
            dislikes: [],
          },
        ]
      )
    );

    expect(confidence.level).toBe('high');
  });

  it('rates thin, single-source evidence as low', () => {
    const confidence = computeEvidenceConfidence(
      result([theme([quote()])])
    );

    expect(confidence.level).toBe('low');
  });
});

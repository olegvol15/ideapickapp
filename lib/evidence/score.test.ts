import { describe, expect, it } from 'vitest';
import type { PainEvidenceResult, PainQuote } from '@/lib/schemas';
import { computeIdeaScore } from './score';

function quote(overrides: Partial<PainQuote> = {}): PainQuote {
  return {
    text: 'A complaint about the problem.',
    source: 'reddit',
    sourceLabel: 'Reddit r/testing',
    intensity: 2,
    ...overrides,
  };
}

function result(themes: PainEvidenceResult['themes']): PainEvidenceResult {
  return {
    problem: 'A test problem',
    summary: 'Summary.',
    totalQuotes: themes.reduce((sum, t) => sum + t.quotes.length, 0),
    themes,
  };
}

describe('computeIdeaScore', () => {
  it('returns zeros when there are no complaint quotes', () => {
    const related = result([
      {
        label: 'Workarounds',
        evidenceType: 'related',
        mentionCount: 2,
        quotes: [quote(), quote()],
      },
    ]);

    expect(computeIdeaScore(related, true)).toEqual({
      score: 0,
      scoreBreakdown: {
        problemStrength: 0,
        complaintFrequency: 0,
        audienceReachability: 0,
      },
    });
  });

  it('computes each component from complaint evidence only', () => {
    const themes: PainEvidenceResult['themes'] = [
      {
        label: 'Cannot sync',
        evidenceType: 'complaint',
        mentionCount: 10,
        quotes: Array.from({ length: 10 }, (_, i) =>
          quote({
            intensity: 2,
            sourceLabel: `Reddit r/community${i % 3}`,
          })
        ),
      },
      {
        label: 'Advice threads',
        evidenceType: 'related',
        mentionCount: 5,
        quotes: Array.from({ length: 5 }, () => quote({ intensity: 1 })),
      },
    ];

    const { score, scoreBreakdown } = computeIdeaScore(result(themes), true);

    // 10 complaint quotes, all intensity 2 → strength 50.
    expect(scoreBreakdown.problemStrength).toBe(50);
    // sqrt(10/40)·100 = 50, +10 concentration bonus (top theme ≥ 5).
    expect(scoreBreakdown.complaintFrequency).toBe(60);
    // 3 distinct communities → 65, +10 audience input.
    expect(scoreBreakdown.audienceReachability).toBe(75);
    expect(score).toBe(Math.round(0.4 * 50 + 0.35 * 60 + 0.25 * 75));
  });

  it('caps frequency and reachability at 100', () => {
    const themes: PainEvidenceResult['themes'] = [
      {
        label: 'Everything is broken',
        evidenceType: 'complaint',
        mentionCount: 60,
        quotes: Array.from({ length: 60 }, (_, i) =>
          quote({ intensity: 3, sourceLabel: `Reddit r/sub${i}` })
        ),
      },
    ];

    const { score, scoreBreakdown } = computeIdeaScore(result(themes), true);

    expect(scoreBreakdown.problemStrength).toBe(100);
    expect(scoreBreakdown.complaintFrequency).toBe(100);
    expect(scoreBreakdown.audienceReachability).toBe(100);
    expect(score).toBe(100);
  });

  it('counts only real communities toward reach', () => {
    const themes: PainEvidenceResult['themes'] = [
      {
        label: 'Generic output',
        evidenceType: 'complaint',
        mentionCount: 4,
        quotes: [
          // Editorial article domains without authors: no reach.
          quote({ source: 'web', sourceLabel: 'somevendor.co', author: undefined }),
          quote({ source: 'web', sourceLabel: 'hemispheredm.com', author: undefined }),
          // Q&A platform counts even without an author.
          quote({ source: 'web', sourceLabel: 'quora.com', author: undefined }),
          // Authored forum post counts.
          quote({ source: 'web', sourceLabel: 'graphicdesignforum.com', author: 'designer42' }),
        ],
      },
    ];

    const { scoreBreakdown } = computeIdeaScore(result(themes), false);
    // 2 communities (quora + authored forum) → 50; article domains add nothing.
    expect(scoreBreakdown.audienceReachability).toBe(50);
  });

  it('treats quotes without intensity as moderate', () => {
    const themes: PainEvidenceResult['themes'] = [
      {
        label: 'Old data',
        evidenceType: 'complaint',
        mentionCount: 2,
        quotes: [quote({ intensity: undefined }), quote({ intensity: undefined })],
      },
    ];

    const { scoreBreakdown } = computeIdeaScore(result(themes), false);
    expect(scoreBreakdown.problemStrength).toBe(50);
  });
});

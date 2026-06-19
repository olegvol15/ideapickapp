import { describe, expect, it } from 'vitest';
import type {
  CompetitorInsight,
  PainEvidenceResult,
  PainQuote,
} from '@/lib/schemas';
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

function competitor(dislikeCount: number): CompetitorInsight {
  return {
    name: `Competitor ${dislikeCount}`,
    description: 'An existing product in the space.',
    likes: [],
    dislikes: Array.from({ length: dislikeCount }, (_, i) => ({
      text: `People dislike thing ${i}`,
      sources: [{ text: 'source excerpt', label: 'somewhere.com' }],
    })),
  };
}

function result(
  themes: PainEvidenceResult['themes'],
  competitors?: CompetitorInsight[]
): PainEvidenceResult {
  return {
    problem: 'A test problem',
    summary: 'Summary.',
    totalQuotes: themes.reduce((sum, t) => sum + t.quotes.length, 0),
    themes,
    competitors,
  };
}

describe('computeIdeaScore', () => {
  it('scores related-only evidence on demand and reach but not strength', () => {
    const related = result([
      {
        label: 'Workarounds',
        evidenceType: 'related',
        mentionCount: 4,
        quotes: [
          quote({ sourceLabel: 'Reddit r/a' }),
          quote({ sourceLabel: 'Reddit r/a' }),
          quote({ sourceLabel: 'Reddit r/b' }),
          quote({ sourceLabel: 'Reddit r/b' }),
        ],
      },
    ]);

    const { score, scoreBreakdown } = computeIdeaScore(related, false);
    // No pain expressed → no strength, but related is demand + reach signal.
    expect(scoreBreakdown.problemStrength).toBe(0);
    // effective = 0.3·4 = 1.2 → round(100·sqrt(1.2/24)) = 22.
    expect(scoreBreakdown.complaintFrequency).toBe(22);
    // 2 distinct communities → 50.
    expect(scoreBreakdown.audienceReachability).toBe(50);
    expect(score).toBe(20);
  });

  it('blends complaint, related, and competitor evidence', () => {
    const themes: PainEvidenceResult['themes'] = [
      {
        label: 'Cannot sync',
        evidenceType: 'complaint',
        mentionCount: 4,
        quotes: Array.from({ length: 4 }, (_, i) =>
          quote({ intensity: 2, sourceLabel: `Reddit r/community${i % 3}` })
        ),
      },
      {
        label: 'Advice threads',
        evidenceType: 'related',
        mentionCount: 3,
        quotes: Array.from({ length: 3 }, () =>
          quote({ intensity: 1, sourceLabel: 'Reddit r/community0' })
        ),
      },
    ];

    const { score, scoreBreakdown } = computeIdeaScore(
      result(themes, [competitor(3), competitor(1)]),
      true
    );

    // 4 complaints @2 + 4 dislikes @2.5 → avg 2.25 → ((1.25)/2)·100 = 63.
    expect(scoreBreakdown.problemStrength).toBe(63);
    // effective = 4 + 0.3·3 + 0.2·4 = 5.7 → round(100·sqrt(5.7/24)) = 49.
    expect(scoreBreakdown.complaintFrequency).toBe(49);
    // 3 communities → 65, +10 audience input, +5 competitor bonus (capped).
    expect(scoreBreakdown.audienceReachability).toBe(80);
    expect(score).toBe(62);
  });

  it('produces a non-zero score from competitor dislikes alone', () => {
    const { score, scoreBreakdown } = computeIdeaScore(
      result([], [competitor(3)]),
      false
    );

    // 3 dislikes @2.5 → avg 2.5 → ((1.5)/2)·100 = 75.
    expect(scoreBreakdown.problemStrength).toBe(75);
    // effective = 0.2·3 = 0.6 → round(100·sqrt(0.6/24)) = 16.
    expect(scoreBreakdown.complaintFrequency).toBe(16);
    // No communities, +5 for one competitor.
    expect(scoreBreakdown.audienceReachability).toBe(5);
    expect(score).toBe(37);
  });

  it('caps how many competitor dislikes count toward the score', () => {
    const flooded = computeIdeaScore(result([], [competitor(20)]), false);
    const capped = computeIdeaScore(result([], [competitor(8)]), false);

    // Dislikes beyond MAX_COUNTED_DISLIKES (8) add nothing — a crowded
    // market cannot flood the score with bullet volume.
    expect(flooded.scoreBreakdown).toEqual(capped.scoreBreakdown);
    expect(flooded.score).toBe(capped.score);
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

  it('clamps related chatter so it cannot outrun direct complaints', () => {
    const themes: PainEvidenceResult['themes'] = [
      {
        label: 'Real complaint',
        evidenceType: 'complaint',
        mentionCount: 2,
        quotes: [quote(), quote()],
      },
      {
        label: 'Endless related chatter',
        evidenceType: 'related',
        mentionCount: 100,
        quotes: Array.from({ length: 100 }, () => quote({ intensity: 1 })),
      },
    ];

    const { scoreBreakdown } = computeIdeaScore(result(themes), false);
    // related contribution clamped to complaintCount + 2 = 4.
    // effective = 2 + 4 = 6 → round(100·sqrt(6/24)) = 50, far below 100.
    expect(scoreBreakdown.complaintFrequency).toBe(50);
  });

  it('counts communities across complaint and related themes for reach', () => {
    const themes: PainEvidenceResult['themes'] = [
      {
        label: 'Generic output',
        evidenceType: 'complaint',
        mentionCount: 1,
        // Editorial article domain without an author: no reach.
        quotes: [quote({ source: 'web', sourceLabel: 'somevendor.co' })],
      },
      {
        label: 'Where people discuss it',
        evidenceType: 'related',
        mentionCount: 2,
        quotes: [
          // Q&A platform counts even without an author.
          quote({ source: 'web', sourceLabel: 'quora.com' }),
          quote({ source: 'reddit', sourceLabel: 'Reddit r/topic' }),
        ],
      },
    ];

    const { scoreBreakdown } = computeIdeaScore(result(themes), false);
    // quora + r/topic = 2 communities → 50; the article domain adds nothing.
    expect(scoreBreakdown.audienceReachability).toBe(50);
  });

  it('treats complaint quotes without intensity as moderate', () => {
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

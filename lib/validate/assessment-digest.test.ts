import { describe, expect, it } from 'vitest';
import type {
  CompetitorInsight,
  PainEvidenceResult,
  ScoreBreakdown,
} from '@/lib/schemas';
import { buildOpportunityGapDigest } from './assessment-digest';

function competitor(
  name: string,
  dislikes: string[]
): CompetitorInsight {
  return {
    name,
    description: `${name} description`,
    likes: [],
    dislikes: dislikes.map((text) => ({ text, sources: [] })),
  };
}

function result(
  competitors: CompetitorInsight[],
  marketSaturation?: number
): PainEvidenceResult {
  const scoreBreakdown: ScoreBreakdown | undefined =
    marketSaturation == null
      ? undefined
      : {
          problemStrength: 50,
          complaintFrequency: 50,
          audienceReachability: 50,
          marketSaturation,
        };
  return {
    problem: 'A test problem',
    summary: 'summary',
    totalQuotes: 0,
    themes: [],
    competitors,
    scoreBreakdown,
  };
}

describe('buildOpportunityGapDigest', () => {
  it('returns an empty string when no competitor has dislikes', () => {
    expect(buildOpportunityGapDigest(result([]))).toBe('');
    expect(
      buildOpportunityGapDigest(result([competitor('Calm', [])]))
    ).toBe('');
  });

  it('lists each competitor with all of its dislikes', () => {
    const digest = buildOpportunityGapDigest(
      result([
        competitor('Headspace', ['Locks core sessions behind a paywall', 'Repetitive content']),
        competitor('Calm', ['Expensive subscription']),
      ])
    );

    expect(digest).toContain('Headspace — users dislike:');
    expect(digest).toContain('Locks core sessions behind a paywall');
    expect(digest).toContain('Repetitive content');
    expect(digest).toContain('Calm — users dislike:');
    expect(digest).toContain('Expensive subscription');
  });

  it('describes a crowded market from a high saturation score', () => {
    const digest = buildOpportunityGapDigest(
      result([competitor('Headspace', ['Paywall'])], 80)
    );
    expect(digest).toContain('Market saturation: 80/100');
    expect(digest).toContain('crowded with entrenched incumbents');
  });

  it('describes an open market from a low saturation score', () => {
    const digest = buildOpportunityGapDigest(
      result([competitor('NicheApp', ['Clunky UI'])], 10)
    );
    expect(digest).toContain('wide open');
  });

  it('omits the saturation line when no breakdown exists', () => {
    const digest = buildOpportunityGapDigest(
      result([competitor('Headspace', ['Paywall'])])
    );
    expect(digest).not.toContain('Market saturation');
    expect(digest).toContain('Headspace — users dislike:');
  });
});

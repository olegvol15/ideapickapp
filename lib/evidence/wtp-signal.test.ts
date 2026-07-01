import { describe, expect, it } from 'vitest';
import type { PainEvidenceResult, PainQuote, PainTheme } from '@/lib/schemas';
import { computeWtpSignal, wtpBonus } from './wtp-signal';

function quote(overrides: Partial<PainQuote> = {}): PainQuote {
  return {
    text: 'A complaint about the problem.',
    source: 'reddit',
    sourceLabel: 'Reddit r/testing',
    ...overrides,
  };
}

function theme(
  quotes: PainQuote[],
  evidenceType: PainTheme['evidenceType'] = 'complaint'
): PainTheme {
  return { label: 'A theme', evidenceType, mentionCount: quotes.length, quotes };
}

function result(themes: PainTheme[]): PainEvidenceResult {
  return {
    problem: 'A test problem',
    summary: 'summary',
    totalQuotes: themes.reduce((n, t) => n + t.quotes.length, 0),
    themes,
  };
}

describe('computeWtpSignal', () => {
  it('rates multi-category, multi-source buy intent as strong', () => {
    const signal = computeWtpSignal(
      result([
        theme([
          quote({
            text: "Honestly I'd pay for a tool that fixes this.",
            source: 'reddit',
            sourceLabel: 'Reddit r/a',
          }),
          quote({
            text: 'We pay $40/mo for the current one and still hate it.',
            source: 'web',
            sourceLabel: 'news.ycombinator.com',
          }),
          quote({
            text: "I'm looking to replace it with anything better.",
            source: 'x',
            sourceLabel: 'X',
          }),
        ]),
      ])
    );

    expect(signal.level).toBe('strong');
    expect(signal.count).toBe(3);
    expect(signal.breakdown.willingToPay).toBe(1);
    expect(signal.breakdown.currentlyPaying).toBe(1);
    expect(signal.breakdown.switchIntent).toBe(1);
  });

  it('rates a single buy signal as weak', () => {
    const signal = computeWtpSignal(
      result([theme([quote({ text: 'Take my money, this is exactly it.' })])])
    );

    expect(signal.level).toBe('weak');
    expect(signal.count).toBe(1);
    expect(signal.breakdown.willingToPay).toBe(1);
  });

  it('does not reach strong without corroboration across categories or sources', () => {
    // Three matches, all the same category and same source → weak, not strong.
    const signal = computeWtpSignal(
      result([
        theme([
          quote({ text: "I'd pay for this today." }),
          quote({ text: "I would happily pay for a fix." }),
          quote({ text: "Take my money already." }),
        ]),
      ])
    );

    expect(signal.count).toBe(3);
    expect(signal.level).toBe('weak');
  });

  it('returns none when there are no buy signals', () => {
    const signal = computeWtpSignal(
      result([theme([quote({ text: 'This is frustrating and slow.' })])])
    );

    expect(signal.level).toBe('none');
    expect(signal.count).toBe(0);
    expect(signal.examples).toHaveLength(0);
  });

  it('rejects negated intent via guards', () => {
    const signal = computeWtpSignal(
      result([
        theme([
          quote({ text: "I wouldn't pay for something like this." }),
          quote({ text: 'No one would pay for that.' }),
          quote({ text: "It's not worth paying for." }),
          quote({ text: "Honestly it isn't worth the money." }),
          quote({ text: "I would never buy this." }),
        ]),
      ])
    );

    expect(signal.level).toBe('none');
    expect(signal.count).toBe(0);
  });

  it('matches common real-world buy phrasing across variants', () => {
    const cases = [
      "I've been paying for Grammarly for two years now.",
      "I'm paying for Notion and it's still clunky.",
      "I'd happily pay good money for something that works.",
      'Honestly worth the money if it actually delivered.',
      'I subscribe to three of these and none nail it.',
      'I want to switch away from Slack for this.',
      'I would gladly buy a proper solution.',
    ];
    for (const text of cases) {
      const signal = computeWtpSignal(result([theme([quote({ text })])]));
      expect(signal.count, `should match: ${text}`).toBe(1);
    }
  });

  it('counts each quote once and dedupes examples by text', () => {
    const duplicate = { text: "I'd pay for this in a heartbeat." };
    const signal = computeWtpSignal(
      result([
        theme([
          quote({ ...duplicate, sourceLabel: 'Reddit r/a' }),
          quote({ ...duplicate, sourceLabel: 'Reddit r/b' }),
        ]),
      ])
    );

    // Both quotes match, but examples are deduped by text.
    expect(signal.count).toBe(2);
    expect(signal.examples).toHaveLength(1);
  });

  it('caps examples at three, preferring rated/high-intensity quotes', () => {
    const signal = computeWtpSignal(
      result([
        theme([
          quote({ text: "I'd pay for A.", intensity: 1 }),
          quote({ text: "I'd pay for B.", intensity: 2 }),
          quote({
            text: "I'd pay for C.",
            source: 'appstore',
            sourceLabel: 'App Store, C',
            rating: 5,
          }),
          quote({ text: "I'd pay for D.", intensity: 3 }),
        ]),
      ])
    );

    expect(signal.count).toBe(4);
    expect(signal.examples).toHaveLength(3);
    // The App Store rated quote outweighs the intensity-only ones.
    expect(signal.examples[0].text).toBe("I'd pay for C.");
  });
});

describe('wtpBonus', () => {
  it('maps levels to a capped bonus', () => {
    expect(wtpBonus({ ...base, level: 'strong' })).toBe(8);
    expect(wtpBonus({ ...base, level: 'weak' })).toBe(4);
    expect(wtpBonus({ ...base, level: 'none' })).toBe(0);
  });
});

const base = {
  count: 0,
  breakdown: { willingToPay: 0, currentlyPaying: 0, switchIntent: 0 },
  examples: [],
  level: 'none' as const,
};

import { describe, expect, it } from 'vitest';
import type { PainEvidenceResult, PainQuote, PainTheme } from '@/lib/schemas';
import { buildInterviewSources } from './interview-sources';

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

describe('buildInterviewSources', () => {
  it('groups Reddit quotes by subreddit with counts and a subreddit URL', () => {
    const sources = buildInterviewSources(
      result([
        theme([
          quote({ text: 'a', sourceLabel: 'Reddit r/fitness' }),
          quote({ text: 'b', sourceLabel: 'Reddit r/fitness' }),
          quote({ text: 'c', sourceLabel: 'Reddit r/running' }),
        ]),
      ])
    );

    expect(sources).toEqual([
      {
        kind: 'reddit',
        label: 'r/fitness',
        url: 'https://www.reddit.com/r/fitness/',
        count: 2,
        faviconDomain: 'reddit.com',
      },
      {
        kind: 'reddit',
        label: 'r/running',
        url: 'https://www.reddit.com/r/running/',
        count: 1,
        faviconDomain: 'reddit.com',
      },
    ]);
  });

  it('excludes App Store and X quotes — not reachable complainer communities', () => {
    const sources = buildInterviewSources(
      result([
        theme([
          quote({ text: 'a', sourceLabel: 'Reddit r/fitness' }),
          quote({
            text: 'b',
            source: 'appstore',
            sourceLabel: 'App Store review, Fitbit (★2)',
            appName: 'Fitbit',
            url: 'https://apps.apple.com/app/fitbit',
            rating: 2,
          }),
          quote({
            text: 'c',
            source: 'x',
            sourceLabel: 'X',
            author: 'janedev',
            url: 'https://x.com/janedev/status/1',
          }),
        ]),
      ])
    );

    expect(sources.map((s) => s.kind)).toEqual(['reddit']);
  });

  it('groups web quotes by domain and drops www', () => {
    const [source] = buildInterviewSources(
      result([
        theme([
          quote({
            text: 'a',
            source: 'web',
            sourceLabel: 'news.ycombinator.com',
            url: 'https://news.ycombinator.com/item?id=1',
          }),
          quote({
            text: 'b',
            source: 'web',
            sourceLabel: 'Hacker News',
            url: 'https://www.news.ycombinator.com/item?id=2',
          }),
        ]),
      ])
    );

    expect(source).toEqual({
      kind: 'web',
      label: 'news.ycombinator.com',
      url: 'https://news.ycombinator.com/item?id=1',
      count: 2,
      faviconDomain: 'news.ycombinator.com',
    });
  });

  it('excludes web places with no reachable audience (stores, vendor pages)', () => {
    const sources = buildInterviewSources(
      result([
        theme([
          quote({ text: 'a', sourceLabel: 'Reddit r/fitness' }),
          quote({
            text: 'b',
            source: 'web',
            sourceLabel: 'apps.apple.com',
            url: 'https://apps.apple.com/us/app/some-app/id123',
          }),
          quote({
            text: 'c',
            source: 'web',
            sourceLabel: 'play.google.com',
            url: 'https://play.google.com/store/apps/details?id=com.x',
          }),
          quote({
            text: 'd',
            source: 'web',
            sourceLabel: 'mathseeds.com',
            url: 'https://mathseeds.com/',
          }),
        ]),
      ])
    );

    expect(sources.map((s) => s.label)).toEqual(['r/fitness']);
  });

  it('dedupes the same quote appearing under multiple themes', () => {
    const shared = quote({ text: 'same', sourceLabel: 'Reddit r/fitness' });
    const sources = buildInterviewSources(
      result([theme([shared]), theme([shared], 'related')])
    );

    expect(sources).toHaveLength(1);
    expect(sources[0].count).toBe(1);
  });

  it('ranks complaint-backed places above related ones on a tie', () => {
    const sources = buildInterviewSources(
      result([
        theme([quote({ text: 'a', sourceLabel: 'Reddit r/related' })], 'related'),
        theme([quote({ text: 'b', sourceLabel: 'Reddit r/complaint' })]),
      ])
    );

    expect(sources.map((s) => s.label)).toEqual(['r/complaint', 'r/related']);
  });

  it('caps the list at six places', () => {
    const quotes = Array.from({ length: 10 }, (_, i) =>
      quote({ text: `q${i}`, sourceLabel: `Reddit r/sub${i}` })
    );
    expect(buildInterviewSources(result([theme(quotes)]))).toHaveLength(6);
  });

  it('returns nothing for a result with no themes', () => {
    expect(buildInterviewSources(result([]))).toEqual([]);
  });
});

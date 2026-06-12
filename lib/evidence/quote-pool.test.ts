import { describe, expect, it } from 'vitest';
import type { ThemeClusterLLM } from '@/lib/schemas';
import {
  assembleResult,
  buildQuotePool,
  evidenceTypeCounts,
  hasQuoteAccountingIssues,
  matchedQuoteCount,
  matchedSourceCounts,
  validateQuoteAccounting,
  type PooledQuote,
} from './quote-pool';

const completeClusters: ThemeClusterLLM = {
  summary: 'Recurring complaints are present.',
  themes: [
    {
      label: 'Sync keeps breaking',
      evidenceType: 'complaint',
      quotes: [
        { id: 0, severity: 3 },
        { id: 1, severity: 2 },
      ],
    },
    {
      label: 'Tracking workarounds',
      evidenceType: 'related',
      quotes: [{ id: 2, severity: 1 }],
    },
  ],
  excluded: [
    { id: 3, category: 'promo' },
    { id: 4, category: 'not_complaint' },
  ],
};

describe('quote accounting', () => {
  it('accepts exact one-time accounting', () => {
    const issues = validateQuoteAccounting(5, completeClusters);
    expect(hasQuoteAccountingIssues(issues)).toBe(false);
  });

  it('reports missing, duplicate, and out-of-range IDs', () => {
    const issues = validateQuoteAccounting(5, {
      summary: 'Invalid accounting.',
      themes: [
        {
          label: 'Theme',
          evidenceType: 'complaint',
          quotes: [
            { id: 0, severity: 2 },
            { id: 0, severity: 2 },
            { id: 8, severity: 2 },
          ],
        },
      ],
      excluded: [{ id: 1, category: 'off_topic' }],
    });

    expect(issues).toEqual({
      missingIds: [2, 3, 4],
      duplicateIds: [0],
      invalidIds: [8],
    });
  });
});

describe('result assembly', () => {
  it('preserves Reddit authors and derives matched counts', () => {
    const pool: PooledQuote[] = Array.from({ length: 5 }, (_, id) => ({
      id,
      text: `Quote ${id}`,
      source: 'reddit',
      sourceLabel: 'Reddit r/testing',
      author: `user${id}`,
      url: `https://reddit.com/comment/${id}`,
    }));

    const result = assembleResult(pool, completeClusters, 'A test problem');

    expect(result.themes[0].quotes[0].author).toBe('user0');
    expect(result.themes[0].quotes[0].intensity).toBe(3);
    expect(result.totalQuotes).toBe(5);
    expect(matchedQuoteCount(result)).toBe(3);
    expect(evidenceTypeCounts(result)).toEqual({
      complaint: 2,
      related: 1,
    });
    expect(matchedSourceCounts(result)).toEqual({
      reddit: 3,
      web: 0,
      appstore: 0,
    });
  });

  it('keeps historical App Store evidence renderable', () => {
    const pool: PooledQuote[] = [
      {
        id: 0,
        text: 'Logging is unreliable.',
        source: 'appstore',
        sourceLabel: 'App Store · Water Tracker',
        appName: 'Water Tracker',
        rating: 2,
        url: 'https://apps.apple.com/app/id123',
      },
    ];
    const result = assembleResult(
      pool,
      {
        summary: 'A saved review identifies a reliability problem.',
        themes: [
          {
            label: 'Logging is unreliable',
            evidenceType: 'complaint',
            quotes: [{ id: 0, severity: 2 }],
          },
        ],
        excluded: [],
      },
      'Tracking is unreliable'
    );

    expect(result.themes[0].quotes[0]).toMatchObject({
      source: 'appstore',
      appName: 'Water Tracker',
      rating: 2,
    });
    expect(matchedSourceCounts(result).appstore).toBe(1);
  });
});

describe('pool source balance', () => {
  it('does not let Reddit consume the pool before web evidence', () => {
    const reddit = Array.from({ length: 45 }, (_, id) => ({
      text: `Reddit complaint ${id}`,
      source: 'reddit' as const,
      sourceLabel: 'Reddit',
      url: `https://reddit.com/${id}`,
    }));
    const web = Array.from({ length: 10 }, (_, id) => ({
      text: `Forum complaint ${id}`,
      source: 'web' as const,
      sourceLabel: 'forum.example',
      url: `https://forum.example/${id}`,
    }));

    const pool = buildQuotePool([...reddit, ...web], []);

    expect(pool.filter((quote) => quote.source === 'web')).toHaveLength(10);
    expect(pool.slice(0, 20).filter((quote) => quote.source === 'web')).toHaveLength(
      10
    );
  });
});

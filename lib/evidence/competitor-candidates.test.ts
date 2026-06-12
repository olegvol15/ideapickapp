import { describe, expect, it } from 'vitest';
import {
  matchesCandidateName,
  mergeCompetitorCandidates,
  normalizeCompetitorName,
  pickCompetitorCandidates,
  type CompetitorCandidate,
} from './competitor-candidates';

function candidate(
  overrides: Partial<CompetitorCandidate> & Pick<CompetitorCandidate, 'name' | 'lane'>
): CompetitorCandidate {
  return { ...overrides };
}

describe('normalizeCompetitorName', () => {
  it('strips suffixes, articles, and the word app', () => {
    expect(normalizeCompetitorName('Toggl Track – Time Tracking')).toBe(
      'toggl track'
    );
    expect(normalizeCompetitorName('The Teal App')).toBe('teal');
  });
});

describe('mergeCompetitorCandidates', () => {
  it('prioritizes mentioned over search over known, capped at 10', () => {
    const merged = mergeCompetitorCandidates({
      mentioned: [candidate({ name: 'Teal', lane: 'mentioned', quoteIds: [3] })],
      searched: Array.from({ length: 8 }, (_, i) =>
        candidate({ name: `SearchTool${i}`, lane: 'search' })
      ),
      known: [
        candidate({ name: 'Notion', lane: 'known' }),
        candidate({ name: 'Airtable', lane: 'known' }),
      ],
    });

    expect(merged).toHaveLength(10);
    expect(merged[0]).toMatchObject({ name: 'Teal', lane: 'mentioned' });
    // Lower-priority known candidates fill remaining headroom only.
    expect(merged.filter((m) => m.lane === 'known')).toHaveLength(1);
  });

  it('dedupes across lanes by normalized name and merges details', () => {
    const merged = mergeCompetitorCandidates({
      mentioned: [candidate({ name: 'teal app', lane: 'mentioned', quoteIds: [1, 2] })],
      searched: [],
      known: [
        candidate({
          name: 'Teal',
          lane: 'known',
          url: 'https://tealhq.com',
          description: 'Job search tracker.',
        }),
      ],
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      lane: 'mentioned',
      url: 'https://tealhq.com',
      description: 'Job search tracker.',
      quoteIds: [1, 2],
    });
  });

  it('dedupes by URL host when names differ', () => {
    const merged = mergeCompetitorCandidates({
      mentioned: [],
      searched: [
        candidate({
          name: 'Huntr: Job Search CRM',
          lane: 'search',
          url: 'https://www.huntr.co/product',
        }),
      ],
      known: [
        candidate({ name: 'Huntr Board', lane: 'known', url: 'https://huntr.co' }),
      ],
    });

    expect(merged).toHaveLength(1);
    expect(merged[0].lane).toBe('search');
  });

  it('drops candidates whose name normalizes to nothing', () => {
    const merged = mergeCompetitorCandidates({
      mentioned: [candidate({ name: 'The App', lane: 'mentioned', quoteIds: [0] })],
      searched: [],
      known: [],
    });
    expect(merged).toHaveLength(0);
  });
});

describe('pickCompetitorCandidates', () => {
  const mentioned = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      candidate({ name: `Quoted${i}`, lane: 'mentioned', quoteIds: [i] })
    );
  const market = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      candidate({ name: `Market${i}`, lane: 'search' })
    );

  it('caps mentioned at 4 so incumbents keep at least 2 slots', () => {
    const picked = pickCompetitorCandidates([...mentioned(6), ...market(3)]);
    expect(picked).toHaveLength(6);
    expect(picked.filter((c) => c.lane === 'mentioned')).toHaveLength(4);
    expect(picked.filter((c) => c.lane === 'search')).toHaveLength(2);
  });

  it('lets market candidates fill unused mentioned slots', () => {
    const picked = pickCompetitorCandidates([...mentioned(1), ...market(8)]);
    expect(picked).toHaveLength(6);
    expect(picked[0].lane).toBe('mentioned');
    expect(picked.filter((c) => c.lane === 'search')).toHaveLength(5);
  });

  it('handles market-only and empty inputs', () => {
    expect(pickCompetitorCandidates(market(8))).toHaveLength(6);
    expect(pickCompetitorCandidates([])).toHaveLength(0);
  });
});

describe('matchesCandidateName', () => {
  it('accepts results whose title contains the candidate name', () => {
    expect(
      matchesCandidateName(
        'Strong',
        'Strong Workout Tracker Gym Log',
        'apps.apple.com'
      )
    ).toBe(true);
    expect(matchesCandidateName('Huntr', 'Huntr: Job Search CRM', 'huntr.co')).toBe(
      true
    );
  });

  it('accepts results whose hostname contains the compact name', () => {
    expect(matchesCandidateName('Strong', 'Workout tracking', 'strongapp.io')).toBe(
      true
    );
    expect(matchesCandidateName('FitnessAI', 'Home', 'fitnessai.com')).toBe(true);
  });

  it('rejects unrelated results and too-short hostname matches', () => {
    expect(
      matchesCandidateName('Gymfile', 'Best gym apps 2026', 'example.com')
    ).toBe(false);
    // 3-letter compact names never match via hostname containment.
    expect(matchesCandidateName('Gym', 'Other product', 'mygymco.com')).toBe(
      false
    );
  });
});

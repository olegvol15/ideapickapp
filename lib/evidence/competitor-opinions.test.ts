import { describe, expect, it } from 'vitest';
import type { AppStoreApp, AppStoreReview } from '@/lib/discovery/mobile';
import {
  pickBestAppMatch,
  resolveOpinionBullets,
  splitReviewMaterials,
  type OpinionMaterial,
} from './competitor-opinions';

function app(trackName: string): AppStoreApp {
  return { trackName, trackViewUrl: `https://apps.apple.com/app/id1` };
}

function review(rating: number, body: string): AppStoreReview {
  return { rating, title: 'Review', body };
}

describe('pickBestAppMatch', () => {
  const apps = [app('Toggl Track Alternatives'), app('Toggl Track'), app('Clockify')];

  it('prefers an exact name match over earlier results', () => {
    expect(pickBestAppMatch(apps, 'Toggl Track')?.trackName).toBe(
      'Toggl Track'
    );
  });

  it('falls back to prefix match, then first result', () => {
    expect(pickBestAppMatch(apps, 'Toggl')?.trackName).toBe(
      'Toggl Track Alternatives'
    );
    expect(pickBestAppMatch(apps, 'Harvest')?.trackName).toBe(
      'Toggl Track Alternatives'
    );
    expect(pickBestAppMatch([], 'Harvest')).toBeUndefined();
  });
});

describe('splitReviewMaterials', () => {
  it('splits by rating with stable IDs, labels, and the app URL', () => {
    const materials = splitReviewMaterials(
      [
        review(5, 'Love the one-click timers and the clean interface design.'),
        review(4, 'Reports are detailed enough to send straight to clients.'),
        review(2, 'Sync between my phone and laptop fails constantly, lost hours.'),
        review(1, 'short'),
      ],
      'https://apps.apple.com/app/id1'
    );

    const positives = materials.filter((m) => m.kind === 'positive');
    const complaints = materials.filter((m) => m.kind === 'complaint');
    expect(positives.map((m) => m.id)).toEqual(['P0', 'P1']);
    expect(complaints).toHaveLength(1);
    expect(complaints[0]).toMatchObject({
      id: 'C0',
      label: 'App Store review (★2)',
      url: 'https://apps.apple.com/app/id1',
    });
  });

  it('caps each side at 8 and truncates long bodies', () => {
    const long = 'word '.repeat(120).trim();
    const materials = splitReviewMaterials(
      Array.from({ length: 12 }, () => review(5, long))
    );

    expect(materials).toHaveLength(8);
    expect(materials[0].text.length).toBeLessThanOrEqual(301);
    expect(materials[0].text.endsWith('…')).toBe(true);
  });
});

describe('resolveOpinionBullets', () => {
  const materials: OpinionMaterial[] = [
    {
      id: 'C0',
      text: 'Sync fails every time I switch devices.',
      label: 'App Store review (★1)',
      url: 'https://apps.apple.com/app/id1',
      kind: 'complaint',
    },
    {
      id: 'M0',
      text: 'I moved away from it because the price doubled.',
      label: 'reddit.com',
      url: 'https://reddit.com/r/x/comments/1',
      kind: 'mixed',
    },
  ];

  it('resolves cited IDs to verbatim source excerpts', () => {
    const bullets = resolveOpinionBullets(
      [{ text: 'Sync fails between devices', materialIds: ['C0', 'M0'] }],
      materials
    );

    expect(bullets).toHaveLength(1);
    expect(bullets[0].sources).toEqual([
      {
        text: 'Sync fails every time I switch devices.',
        label: 'App Store review (★1)',
        url: 'https://apps.apple.com/app/id1',
      },
      {
        text: 'I moved away from it because the price doubled.',
        label: 'reddit.com',
        url: 'https://reddit.com/r/x/comments/1',
      },
    ]);
  });

  it('drops unknown IDs and bullets with no valid sources', () => {
    const bullets = resolveOpinionBullets(
      [
        { text: 'Partially backed', materialIds: ['C0', 'P9'] },
        { text: 'Invented claim', materialIds: ['Z1'] },
      ],
      materials
    );

    expect(bullets).toHaveLength(1);
    expect(bullets[0].text).toBe('Partially backed');
    expect(bullets[0].sources).toHaveLength(1);
  });

  it('claims each material once so a single source backs one bullet', () => {
    const bullets = resolveOpinionBullets(
      [
        { text: 'First take', materialIds: ['M0'] },
        { text: 'Padded duplicate', materialIds: ['M0'] },
      ],
      materials
    );

    expect(bullets).toHaveLength(1);
    expect(bullets[0].text).toBe('First take');
  });

  it('keeps a later bullet when it still has a distinct source', () => {
    const bullets = resolveOpinionBullets(
      [
        { text: 'Backed by C0', materialIds: ['C0'] },
        { text: 'Backed by M0', materialIds: ['C0', 'M0'] },
      ],
      materials
    );

    expect(bullets.map((b) => b.text)).toEqual(['Backed by C0', 'Backed by M0']);
    // The second bullet keeps only M0 — C0 was already claimed by the first.
    expect(bullets[1].sources).toEqual([
      {
        text: 'I moved away from it because the price doubled.',
        label: 'reddit.com',
        url: 'https://reddit.com/r/x/comments/1',
      },
    ]);
  });
});

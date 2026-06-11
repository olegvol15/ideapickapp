import {
  dedupeApps,
  extractTrackId,
  fetchAppStoreApps,
  fetchAppStoreReviews,
} from '@/lib/discovery/mobile';
import type { AppStoreApp } from '@/lib/discovery/mobile';
import type { PainQuote } from '@/lib/schemas';
import type { EvidenceSource } from '@/types/validate.types';
import { truncateAtWord } from './quote-pool';

const APPS_PER_KEYWORD = 12;
const TOP_APPS = 6;
const REVIEWS_PER_APP = 30;
const MAX_COMPLAINT_RATING = 3;
const MIN_REVIEW_LENGTH = 40;
const MAX_QUOTE_LENGTH = 300;

async function collectAppQuotes(app: AppStoreApp): Promise<PainQuote[]> {
  const trackId = app.trackId ?? extractTrackId(app.trackViewUrl);
  if (!trackId) return [];

  const reviews = await fetchAppStoreReviews(trackId, REVIEWS_PER_APP);
  return reviews
    .filter(
      (r) =>
        r.rating <= MAX_COMPLAINT_RATING &&
        r.body.trim().length >= MIN_REVIEW_LENGTH
    )
    .map((r) => ({
      text: truncateAtWord(r.body, MAX_QUOTE_LENGTH),
      source: 'appstore' as const,
      sourceLabel: `App Store review, ${app.trackName} (★${r.rating})`,
      author: r.author,
      url: app.trackViewUrl,
      rating: r.rating,
      appName: app.trackName,
    }));
}

export async function collectAppStoreQuotes(
  keywords: string[]
): Promise<{ quotes: PainQuote[]; sources: EvidenceSource[] }> {
  if (keywords.length === 0) return { quotes: [], sources: [] };

  const searches = await Promise.all(
    keywords.map((kw) => fetchAppStoreApps(kw, APPS_PER_KEYWORD))
  );
  const topApps = dedupeApps(searches.flat())
    .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
    .slice(0, TOP_APPS);

  const quoteBatches = await Promise.all(topApps.map(collectAppQuotes));

  return {
    quotes: quoteBatches.flat(),
    sources: topApps.map((app) => ({
      name: app.trackName,
      url: app.trackViewUrl,
      source: 'appstore',
      kind: 'appstore' as const,
    })),
  };
}

import {
  fetchAppStoreApps,
  fetchAppStoreReviews,
  extractTrackId,
} from '@/lib/discovery/mobile';
import type { AppStoreApp, AppStoreReview } from '@/lib/discovery/mobile';
import type { CompetitorBullet, CompetitorOpinionLLM } from '@/lib/schemas';
import { truncateAtWord } from './quote-pool';
import { BLOCKED_DOMAINS, matchesDomainSuffix } from './domains';

const TAVILY_URL = 'https://api.tavily.com/search';
const MAX_MATERIALS_PER_SIDE = 8;
const MAX_MATERIAL_LENGTH = 300;
const MIN_MATERIAL_LENGTH = 30;
const REVIEWS_PER_APP = 30;
const POSITIVE_RATING_MIN = 4;

// Each piece of collected material has a stable ID the LLM must cite,
// so every summarized bullet can be traced back to verbatim excerpts.
export interface OpinionMaterial {
  id: string;
  text: string;
  label: string;
  url?: string;
  kind: 'positive' | 'complaint' | 'mixed';
}

export function pickBestAppMatch(
  apps: AppStoreApp[],
  name: string
): AppStoreApp | undefined {
  const target = name.toLowerCase();
  return (
    apps.find((app) => app.trackName.toLowerCase() === target) ??
    apps.find((app) => app.trackName.toLowerCase().startsWith(target)) ??
    apps[0]
  );
}

export function splitReviewMaterials(
  reviews: AppStoreReview[],
  appUrl?: string
): OpinionMaterial[] {
  const usable = reviews.filter(
    (review) => review.body.trim().length >= MIN_MATERIAL_LENGTH
  );
  const toMaterial = (
    review: AppStoreReview,
    kind: 'positive' | 'complaint',
    index: number
  ): OpinionMaterial => ({
    id: `${kind === 'positive' ? 'P' : 'C'}${index}`,
    text: truncateAtWord(review.body, MAX_MATERIAL_LENGTH),
    label: `App Store review (★${review.rating})`,
    url: appUrl,
    kind,
  });

  const positives = usable
    .filter((review) => review.rating >= POSITIVE_RATING_MIN)
    .slice(0, MAX_MATERIALS_PER_SIDE)
    .map((review, i) => toMaterial(review, 'positive', i));
  const complaints = usable
    .filter((review) => review.rating < POSITIVE_RATING_MIN)
    .slice(0, MAX_MATERIALS_PER_SIDE)
    .map((review, i) => toMaterial(review, 'complaint', i));

  return [...positives, ...complaints];
}

async function collectAppStoreOpinions(
  name: string
): Promise<OpinionMaterial[]> {
  const apps = await fetchAppStoreApps(name, 3);
  const app = pickBestAppMatch(apps, name);
  const trackId = app
    ? (app.trackId ?? extractTrackId(app.trackViewUrl))
    : null;
  if (!app || !trackId) return [];

  const reviews = await fetchAppStoreReviews(trackId, REVIEWS_PER_APP);
  return splitReviewMaterials(reviews, app.trackViewUrl);
}

function snippetHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

async function collectWebOpinions(name: string): Promise<OpinionMaterial[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query: `"${name}" review pros cons reddit`,
        search_depth: 'basic',
        max_results: 8,
        include_answer: false,
        include_raw_content: false,
      }),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const results: Array<{ url: string; content: string }> =
      data.results ?? [];

    return results
      .filter((r) => {
        const host = snippetHostname(r.url);
        return host !== '' && !matchesDomainSuffix(host, BLOCKED_DOMAINS);
      })
      .map((r) => ({ url: r.url, text: (r.content ?? '').trim() }))
      .filter((r) => r.text.length >= MIN_MATERIAL_LENGTH)
      .slice(0, MAX_MATERIALS_PER_SIDE * 2)
      .map(
        (r, i): OpinionMaterial => ({
          id: `M${i}`,
          text: truncateAtWord(r.text, MAX_MATERIAL_LENGTH),
          label: snippetHostname(r.url),
          url: r.url,
          kind: 'mixed',
        })
      );
  } catch {
    return [];
  }
}

export async function collectOpinionMaterials(
  name: string,
  productType: string
): Promise<OpinionMaterial[]> {
  try {
    return productType === 'Mobile App'
      ? await collectAppStoreOpinions(name)
      : await collectWebOpinions(name);
  } catch {
    return [];
  }
}

// Maps LLM bullets back to the materials they cite. Bullets citing no
// valid material are dropped — every rendered bullet is provably backed.
export function resolveOpinionBullets(
  llmBullets: CompetitorOpinionLLM['likes'],
  materials: OpinionMaterial[]
): CompetitorBullet[] {
  const byId = new Map(materials.map((m) => [m.id, m]));

  return llmBullets.flatMap((bullet) => {
    const sources = bullet.materialIds.flatMap((id) => {
      const material = byId.get(id);
      if (!material) return [];
      return [{ text: material.text, label: material.label, url: material.url }];
    });
    if (sources.length === 0) return [];
    return [{ text: bullet.text, sources }];
  });
}

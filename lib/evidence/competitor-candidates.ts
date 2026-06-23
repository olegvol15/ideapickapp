import { extractTrackId, fetchAppStoreApps } from '@/lib/discovery/mobile';
import type { AppStoreApp } from '@/lib/discovery/mobile';
import { searchAll } from '@/lib/search';

const MAX_PER_LANE = 5;
// Merge keeps headroom above the final card counts: verification drops
// candidates that resolve to nothing, and the service slices each
// section (mentioned/market) to 4 afterwards.
const MAX_CANDIDATES = 10;
const MAX_DESCRIPTION_LENGTH = 200;

// Lane priority: products users actually mention beat search results,
// which beat the LLM's recalled incumbents.
const LANE_PRIORITY = { mentioned: 0, search: 1, known: 2 } as const;

export interface CompetitorCandidate {
  name: string;
  url?: string;
  description?: string;
  lane: keyof typeof LANE_PRIORITY;
  quoteIds?: number[];
  // Verified App Store match (Mobile App) — reused for review fetching.
  trackId?: number;
  // App Store artwork URL — shown as the card logo when present.
  iconUrl?: string;
  // App Store rating count — entrenchment signal for the saturation penalty.
  reviewCount?: number;
}

export function normalizeCompetitorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*[|–—:-]\s.*$/, '')
    .replace(/\b(the|app|application)\b/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function urlHost(url?: string): string {
  try {
    return new URL(url ?? '').hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

async function searchMobileCandidates(
  query: string
): Promise<CompetitorCandidate[]> {
  const apps = await fetchAppStoreApps(query, 10);
  return apps
    .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
    .slice(0, MAX_PER_LANE)
    .map((app) => ({
      name: app.trackName,
      url: app.trackViewUrl,
      description: app.description
        ? `${app.description.slice(0, MAX_DESCRIPTION_LENGTH).trim()}…`
        : undefined,
      iconUrl: app.artworkUrl100 ?? app.artworkUrl60,
      reviewCount: app.userRatingCount,
      lane: 'search' as const,
    }));
}

async function searchWebCandidates(
  query: string
): Promise<CompetitorCandidate[]> {
  const results = await searchAll([{ query, type: 'competitor' }]);
  return results.slice(0, MAX_PER_LANE).map((result) => ({
    name: result.name.replace(/\s*[|–—-]\s.*$/, '').trim(),
    url: result.url,
    description: result.snippet || undefined,
    lane: 'search' as const,
  }));
}

export async function searchCompetitorCandidates(
  competitorQuery: string,
  productType: string
): Promise<CompetitorCandidate[]> {
  try {
    return productType === 'Mobile App'
      ? await searchMobileCandidates(competitorQuery)
      : await searchWebCandidates(competitorQuery);
  } catch {
    return [];
  }
}

// Strict match for verification: exact normalized name, or the result
// name starting with the candidate name at a word boundary. Never the
// "first result" fallback — wrong-product risk.
function strictAppMatch(
  apps: AppStoreApp[],
  name: string
): AppStoreApp | undefined {
  const target = normalizeCompetitorName(name);
  if (!target) return undefined;
  // Compact comparison tolerates spacing differences ("FitnessAI" vs
  // the store listing "Fitness AI").
  const compactTarget = target.replace(/\s+/g, '');
  return apps.find((app) => {
    const trackName = normalizeCompetitorName(app.trackName);
    const compactTrack = trackName.replace(/\s+/g, '');
    return (
      trackName === target ||
      trackName.startsWith(`${target} `) ||
      compactTrack === compactTarget ||
      compactTrack.startsWith(compactTarget)
    );
  });
}

export function matchesCandidateName(
  candidateName: string,
  resultTitle: string,
  resultHost: string
): boolean {
  const target = normalizeCompetitorName(candidateName);
  if (!target) return false;
  if (normalizeCompetitorName(resultTitle).includes(target)) return true;

  const compact = target.replace(/\s+/g, '');
  if (compact.length < 4) return false;
  return resultHost.toLowerCase().replace(/[^a-z0-9]/g, '').includes(compact);
}

// Resolve a candidate against the App Store and merge in its review count,
// icon, and trackId. A mobile validation only surfaces real App Store apps, so
// a candidate without a strict match is dropped — even if it already carries a
// URL (a web-native tool like MixPanel/Segment is not a mobile competitor).
// This also guarantees every surviving competitor has a review count for the
// saturation signal.
async function enrichOnAppStore(
  candidate: CompetitorCandidate
): Promise<CompetitorCandidate | null> {
  const apps = await fetchAppStoreApps(candidate.name, 5);
  const app = strictAppMatch(apps, candidate.name);
  if (!app) return null;
  return {
    ...candidate,
    // Keep the candidate's own name when it already resolved a product;
    // canonicalize to the store listing only when we just discovered it.
    name: candidate.url ? candidate.name : app.trackName,
    url: candidate.url ?? app.trackViewUrl,
    trackId: candidate.trackId ?? app.trackId ?? extractTrackId(app.trackViewUrl) ?? undefined,
    iconUrl: candidate.iconUrl ?? app.artworkUrl100 ?? app.artworkUrl60,
    reviewCount: candidate.reviewCount ?? app.userRatingCount,
    description:
      candidate.description ??
      (app.description
        ? `${app.description.slice(0, MAX_DESCRIPTION_LENGTH).trim()}…`
        : undefined),
  };
}

async function verifyOnWeb(
  candidate: CompetitorCandidate
): Promise<CompetitorCandidate | null> {
  const results = await searchAll([
    { query: `"${candidate.name}"`, type: 'competitor' },
  ]);
  const match = results.find((result) =>
    matchesCandidateName(candidate.name, result.name, urlHost(result.url))
  );
  if (!match) return null;
  return {
    ...candidate,
    url: match.url,
    description: candidate.description ?? match.snippet ?? undefined,
  };
}

// Candidates without a URL must resolve to a real product (App Store
// match or competitor web result) or they don't render at all. Mobile App
// candidates always go through the App Store so even URL-bearing incumbents
// pick up a review count for the saturation signal.
export async function verifyCompetitorCandidates(
  candidates: CompetitorCandidate[],
  productType: string
): Promise<CompetitorCandidate[]> {
  const verified = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        if (productType === 'Mobile App') {
          // Already enriched (App Store search lane) — no extra lookup needed.
          if (candidate.reviewCount != null) return candidate;
          return await enrichOnAppStore(candidate);
        }
        if (candidate.url) return candidate;
        return await verifyOnWeb(candidate);
      } catch {
        // Mobile validations never keep an unverified web competitor.
        return productType !== 'Mobile App' && candidate.url ? candidate : null;
      }
    })
  );
  return verified.filter(
    (candidate): candidate is CompetitorCandidate => candidate !== null
  );
}

const MAX_MENTIONED_CARDS = 4;
const MAX_TOTAL_CARDS = 6;

// One ranked list: quoted products lead (max 4), incumbents fill the
// remaining slots — the market leader never vanishes behind niche apps.
export function pickCompetitorCandidates(
  verified: CompetitorCandidate[]
): CompetitorCandidate[] {
  const mentioned = verified
    .filter((candidate) => candidate.lane === 'mentioned')
    .slice(0, MAX_MENTIONED_CARDS);
  const market = verified.filter(
    (candidate) => candidate.lane !== 'mentioned'
  );
  return [...mentioned, ...market].slice(0, MAX_TOTAL_CARDS);
}

export function mergeCompetitorCandidates(lanes: {
  mentioned: CompetitorCandidate[];
  searched: CompetitorCandidate[];
  known: CompetitorCandidate[];
}): CompetitorCandidate[] {
  const ordered = [...lanes.mentioned, ...lanes.searched, ...lanes.known].sort(
    (a, b) => LANE_PRIORITY[a.lane] - LANE_PRIORITY[b.lane]
  );

  const merged: CompetitorCandidate[] = [];
  for (const candidate of ordered) {
    const normalized = normalizeCompetitorName(candidate.name);
    if (!normalized) continue;
    const host = urlHost(candidate.url);

    const existing = merged.find((m) => {
      const sameName = normalizeCompetitorName(m.name) === normalized;
      const sameHost = host !== '' && urlHost(m.url) === host;
      return sameName || sameHost;
    });

    if (existing) {
      existing.url ??= candidate.url;
      existing.iconUrl ??= candidate.iconUrl;
      existing.reviewCount ??= candidate.reviewCount;
      existing.description ??= candidate.description;
      if (candidate.quoteIds?.length) {
        existing.quoteIds = [
          ...new Set([...(existing.quoteIds ?? []), ...candidate.quoteIds]),
        ];
      }
      continue;
    }
    if (merged.length < MAX_CANDIDATES) merged.push({ ...candidate });
  }

  return merged;
}

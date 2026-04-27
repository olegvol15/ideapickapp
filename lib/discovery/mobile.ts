import type { Competitor } from '@/types';

const TAVILY_URL = 'https://api.tavily.com/search';

// iTunes rejects queries that include platform keywords — strip them first.
function coreSearchTerm(query: string): string {
  return query
    .replace(/\b(ios|android|mobile|app)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface AppStoreApp {
  trackName: string;
  trackViewUrl: string;
  averageUserRating?: number;
  userRatingCount?: number;
  primaryGenreName?: string;
  description?: string;
  price?: number;
  releaseDate?: string;
  currentVersionReleaseDate?: string;
  trackSubtitle?: string;
}

export async function fetchAppStoreApps(
  query: string,
  limit: number
): Promise<AppStoreApp[]> {
  const term = encodeURIComponent(coreSearchTerm(query));
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=software&limit=${limit}&country=us`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

// Estimate monthly revenue range from App Store data.
// Uses the industry heuristic: 1 review ≈ 100–300 downloads.
export function estimateMonthlyRevenue(app: AppStoreApp): {
  low: number;
  high: number;
} {
  const reviews = app.userRatingCount ?? 0;
  if (reviews === 0) return { low: 0, high: 0 };

  const price = app.price ?? 0;
  const ageDays = app.releaseDate
    ? Math.max(
        30,
        (Date.now() - new Date(app.releaseDate).getTime()) / 86400000
      )
    : 730; // default 2 years if unknown
  const ageMonths = ageDays / 30;

  const monthlyDlLow = (reviews * 100) / ageMonths;
  const monthlyDlHigh = (reviews * 300) / ageMonths;

  if (price > 0) {
    return {
      low: Math.round(monthlyDlLow * price),
      high: Math.round(monthlyDlHigh * price),
    };
  }

  // Free + IAP: 1–3% conversion at $4–8 avg
  return {
    low: Math.round(monthlyDlLow * 0.01 * 4),
    high: Math.round(monthlyDlHigh * 0.03 * 8),
  };
}

// Returns true if the keyword appears at the start of any top-5 app title or subtitle.
// When false, there's a keyword gap — easier to rank organically.
export function keywordInTopTitles(
  apps: AppStoreApp[],
  keyword: string
): boolean {
  const kw = coreSearchTerm(keyword).toLowerCase();
  return apps.slice(0, 5).some((app) => {
    const title = app.trackName.toLowerCase();
    const subtitle = (app.trackSubtitle ?? '').toLowerCase();
    return title.startsWith(kw) || subtitle.startsWith(kw);
  });
}

// Returns true if ≥2 of the top 5 apps are recent (< 6 months) with < 500 reviews.
// Signals weak incumbents — a real entry window.
export function hasWeakIncumbents(apps: AppStoreApp[]): boolean {
  const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const weakCount = apps.slice(0, 5).filter((app) => {
    const released = app.currentVersionReleaseDate
      ? new Date(app.currentVersionReleaseDate).getTime()
      : 0;
    return released > sixMonthsAgo && (app.userRatingCount ?? 0) < 500;
  }).length;
  return weakCount >= 2;
}

export function appToCompetitor(r: AppStoreApp): Competitor {
  const rev = estimateMonthlyRevenue(r);
  return {
    name: r.trackName,
    url: r.trackViewUrl,
    snippet: (r.description ?? '').slice(0, 280),
    source: 'appstore',
    platform: 'iOS',
    rating:
      r.averageUserRating != null
        ? Math.round(r.averageUserRating * 10) / 10
        : undefined,
    reviewCount: r.userRatingCount,
    category: r.primaryGenreName,
    revenueEstimate: rev.low > 0 || rev.high > 0 ? rev : undefined,
  };
}

export function dedupeApps(apps: AppStoreApp[]): AppStoreApp[] {
  const seen = new Set<string>();
  return apps.filter((a) => {
    const key = a.trackViewUrl.split('?')[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchAppStore(query: string): Promise<Competitor[]> {
  const apps = await fetchAppStoreApps(query, 6);
  return apps.map(appToCompetitor);
}

async function searchGooglePlay(query: string): Promise<Competitor[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query: `site:play.google.com/store/apps ${coreSearchTerm(query)}`,
        search_depth: 'basic',
        max_results: 4,
        include_answer: false,
        include_raw_content: false,
      }),
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.results ?? [])
      .filter((r: { url: string }) =>
        r.url.includes('play.google.com/store/apps/details')
      )
      .map(
        (r: { title: string; url: string; content: string }): Competitor => ({
          name: r.title.replace(/\s*[-–|]\s*Apps on Google Play$/i, '').trim(),
          url: r.url,
          snippet: (r.content ?? '').slice(0, 280),
          source: 'googleplay',
          platform: 'Android',
        })
      );
  } catch {
    return [];
  }
}

export async function discoverMobileApps(
  queries: string[]
): Promise<Competitor[]> {
  const searches = queries.flatMap((q) => [
    searchAppStore(q),
    searchGooglePlay(q),
  ]);
  const batches = await Promise.all(searches);
  const seen = new Set<string>();
  const results: Competitor[] = [];

  for (const batch of batches) {
    for (const c of batch) {
      const key = c.url.split('?')[0];
      if (!seen.has(key)) {
        seen.add(key);
        results.push(c);
      }
    }
  }

  return results.slice(0, 12);
}

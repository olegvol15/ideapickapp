import type { Competitor } from "@/types";

const TAVILY_URL = "https://api.tavily.com/search";

// Strip platform noise so iTunes gets a clean search term
function coreSearchTerm(query: string): string {
  return query
    .replace(/\b(ios|android|mobile|app)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── iOS via iTunes Search API ────────────────────────────────────────────────

interface ItunesResult {
  trackName: string;
  trackViewUrl: string;
  averageUserRating?: number;
  userRatingCount?: number;
  primaryGenreName?: string;
  description?: string;
}

async function searchAppStore(query: string): Promise<Competitor[]> {
  const term = encodeURIComponent(coreSearchTerm(query));
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=software&limit=6&country=us`
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.results ?? []).map(
      (r: ItunesResult): Competitor => ({
        name: r.trackName,
        url: r.trackViewUrl,
        snippet: (r.description ?? "").slice(0, 280),
        source: "appstore",
        platform: "iOS",
        rating: r.averageUserRating != null
          ? Math.round(r.averageUserRating * 10) / 10
          : undefined,
        reviewCount: r.userRatingCount,
        category: r.primaryGenreName,
      })
    );
  } catch {
    return [];
  }
}

// ─── Android via Tavily site: search ─────────────────────────────────────────

async function searchGooglePlay(query: string): Promise<Competitor[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query: `site:play.google.com/store/apps ${coreSearchTerm(query)}`,
        search_depth: "basic",
        max_results: 4,
        include_answer: false,
        include_raw_content: false,
      }),
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.results ?? [])
      .filter((r: { url: string }) => r.url.includes("play.google.com/store/apps/details"))
      .map(
        (r: { title: string; url: string; content: string }): Competitor => ({
          name: r.title.replace(/\s*[-–|]\s*Apps on Google Play$/i, "").trim(),
          url: r.url,
          snippet: (r.content ?? "").slice(0, 280),
          source: "googleplay",
          platform: "Android",
        })
      );
  } catch {
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function discoverMobileApps(queries: string[]): Promise<Competitor[]> {
  const searches = queries.flatMap((q) => [searchAppStore(q), searchGooglePlay(q)]);
  const batches = await Promise.all(searches);

  const seen = new Set<string>();
  const results: Competitor[] = [];

  for (const batch of batches) {
    for (const c of batch) {
      const key = c.url.split("?")[0];
      if (!seen.has(key)) {
        seen.add(key);
        results.push(c);
      }
    }
  }

  return results.slice(0, 12);
}

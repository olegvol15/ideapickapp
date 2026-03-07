import type { Competitor } from "@/types";

const TAVILY_URL = "https://api.tavily.com/search";

function extractSource(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Single focused query → normalized competitor list */
export async function searchCompetitors(query: string): Promise<Competitor[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.results ?? []).map(
      (r: { title: string; url: string; content: string }) => ({
        name: r.title,
        url: r.url,
        snippet: (r.content ?? "").slice(0, 300),
        source: extractSource(r.url),
      })
    );
  } catch {
    return [];
  }
}

/** Run multiple queries in parallel, deduplicate by URL */
export async function searchAll(queries: string[]): Promise<Competitor[]> {
  const batches = await Promise.all(queries.map(searchCompetitors));
  const seen = new Set<string>();
  const results: Competitor[] = [];

  for (const batch of batches) {
    for (const c of batch) {
      if (!seen.has(c.url)) {
        seen.add(c.url);
        results.push(c);
      }
    }
  }

  return results;
}

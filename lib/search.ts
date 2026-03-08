import type { Competitor } from "@/types";

const TAVILY_URL = "https://api.tavily.com/search";

// ─── Digital-only filtering ───────────────────────────────────────────────────

// Strong ecommerce/physical-product signals in the page content
const PHYSICAL_SNIPPET_SIGNALS = [
  "add to cart",
  "add to bag",
  "free shipping",
  "in stock",
  "out of stock",
  "buy now",
  "shop now",
  "order now",
  "ships in",
  "fast delivery",
];

// Domain-level signals that strongly indicate a shop/store
const PHYSICAL_DOMAIN_SIGNALS = ["shop.", "store.", "gear.", "equipment.", "merch."];

function isDigitalCompetitor(c: Competitor): boolean {
  const snippetLower = c.snippet.toLowerCase();
  const sourceLower = c.source.toLowerCase();

  if (PHYSICAL_DOMAIN_SIGNALS.some((s) => sourceLower.includes(s))) return false;
  if (PHYSICAL_SNIPPET_SIGNALS.some((s) => snippetLower.includes(s))) return false;

  return true;
}

// ─── Source normalisation ─────────────────────────────────────────────────────

function extractSource(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** Single focused query → normalized + filtered competitor list */
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
    const normalized: Competitor[] = (data.results ?? []).map(
      (r: { title: string; url: string; content: string }) => ({
        name: r.title,
        url: r.url,
        snippet: (r.content ?? "").slice(0, 300),
        source: extractSource(r.url),
      })
    );

    return normalized.filter(isDigitalCompetitor);
  } catch {
    return [];
  }
}

/** Run multiple queries in parallel, deduplicate by URL, keep only digital results */
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

import type { Competitor } from '@/types';

const TAVILY_URL = 'https://api.tavily.com/search';

// Domains that surface articles, reviews, or aggregators — not actual products.
const BLOCKED_DOMAINS = new Set([
  'youtube.com',
  'youtu.be',
  'reddit.com',
  'medium.com',
  'dev.to',
  'news.ycombinator.com',
  'hackernews.com',
  'quora.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'apkpure.com',
  'apkmirror.com',
  'apk-dl.com',
  'alternativeto.net',
  'g2.com',
  'capterra.com',
  'getapp.com',
  'trustradius.com',
  'techradar.com',
  'pcmag.com',
  'cnet.com',
  'tomsguide.com',
  'wikipedia.org',
]);

// Path segments that indicate a blog post or list article rather than a product page.
const BLOCKED_PATH_RE =
  /\/(blog|article|articles|post|posts|news|wiki|tutorial|guide|review|reviews|top-\d+|best-\d+|versus|vs)\b/i;

// Snippet phrases that strongly indicate editorial or e-commerce content.
const ARTICLE_SIGNALS = [
  'in this article',
  'in this post',
  'subscribe to our newsletter',
  'read more',
  'published by',
  'last updated',
];
const ECOMMERCE_SIGNALS = [
  'add to cart',
  'add to bag',
  'free shipping',
  'in stock',
  'out of stock',
  'buy now',
  'shop now',
  'order now',
  'ships in',
];

function extractSource(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function isDigitalProduct(c: Competitor): boolean {
  const source = c.source.toLowerCase();
  const snippet = c.snippet.toLowerCase();
  const path = (() => {
    try {
      return new URL(c.url).pathname.toLowerCase();
    } catch {
      return '';
    }
  })();

  if (BLOCKED_DOMAINS.has(source)) return false;
  if (BLOCKED_PATH_RE.test(path)) return false;
  if (ARTICLE_SIGNALS.some((s) => snippet.includes(s))) return false;
  if (ECOMMERCE_SIGNALS.some((s) => snippet.includes(s))) return false;

  return true;
}

export async function searchCompetitors(query: string): Promise<Competitor[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: 'basic',
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
        snippet: (r.content ?? '').slice(0, 300),
        source: extractSource(r.url),
      })
    );

    return normalized.filter(isDigitalProduct);
  } catch {
    return [];
  }
}

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

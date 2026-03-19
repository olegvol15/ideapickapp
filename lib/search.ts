import type { Competitor } from '@/types';

const TAVILY_URL = 'https://api.tavily.com/search';

// Domains blocked for every result type (spam, pure social, APK mirrors).
const ALWAYS_BLOCKED_DOMAINS = new Set([
  'youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'apkpure.com',
  'apkmirror.com',
  'apk-dl.com',
]);

// Market research / PR newswire sites — never useful to show.
const MARKET_RESEARCH_DOMAINS = new Set([
  'grandviewresearch.com',
  'mordorintelligence.com',
  'marketsandmarkets.com',
  'technavio.com',
  'statista.com',
  'ibisworld.com',
  'globenewswire.com',
  'prnewswire.com',
  'businessresearchinsights.com',
  'verifiedmarketresearch.com',
  'alliedmarketresearch.com',
  'precedenceresearch.com',
  'straitsresearch.com',
]);

// Additional domains blocked only for competitor results (aggregators, editorial).
const COMPETITOR_ONLY_BLOCKED = new Set([
  'reddit.com',
  'medium.com',
  'dev.to',
  'news.ycombinator.com',
  'hackernews.com',
  'quora.com',
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

// Path segments indicating a blog post or list article.
const BLOCKED_PATH_RE =
  /\/(blog|article|articles|post|posts|news|wiki|tutorial|guide|review|reviews|top-\d+|best-\d+|versus|vs)\b/i;

// Snippet phrases that indicate editorial content.
const ARTICLE_SIGNALS = [
  'in this article',
  'in this post',
  'in this guide',
  'subscribe to our newsletter',
  'read more',
  'published by',
  'last updated',
  'ways to ',
  'how to ',
  'tips for ',
  'guide to ',
  'steps to ',
  'you will learn',
  'everything you need to know',
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

// Promotional phrases that indicate a landing/marketing page (not a pain signal).
const PROMO_SIGNALS = [
  'free trial',
  'sign up today',
  'get started for free',
  'pricing starts at',
  'try it free',
  'no credit card required',
  'book a demo',
  'request a demo',
];

function extractSource(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getPath(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function isCompetitorPage(c: Competitor): boolean {
  const source = c.source.toLowerCase();
  const snippet = c.snippet.toLowerCase();
  const path = getPath(c.url);

  if (ALWAYS_BLOCKED_DOMAINS.has(source)) return false;
  if (MARKET_RESEARCH_DOMAINS.has(source)) return false;
  if (COMPETITOR_ONLY_BLOCKED.has(source)) return false;
  if (BLOCKED_PATH_RE.test(path)) return false;
  if (ARTICLE_SIGNALS.some((s) => snippet.includes(s))) return false;
  if (ECOMMERCE_SIGNALS.some((s) => snippet.includes(s))) return false;

  return true;
}

function isPainSignal(c: Competitor): boolean {
  const source = c.source.toLowerCase();
  const snippet = c.snippet.toLowerCase();

  if (ALWAYS_BLOCKED_DOMAINS.has(source)) return false;
  if (MARKET_RESEARCH_DOMAINS.has(source)) return false;
  if (ECOMMERCE_SIGNALS.some((s) => snippet.includes(s))) return false;
  if (PROMO_SIGNALS.some((s) => snippet.includes(s))) return false;

  return true;
}

async function searchWithType(
  query: string,
  type: 'competitor' | 'signal'
): Promise<Competitor[]> {
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
        type,
      })
    );

    return normalized.filter(type === 'signal' ? isPainSignal : isCompetitorPage);
  } catch {
    return [];
  }
}

export async function searchAll(
  queries: { query: string; type: 'competitor' | 'signal' }[]
): Promise<Competitor[]> {
  const batches = await Promise.all(queries.map(({ query, type }) => searchWithType(query, type)));
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

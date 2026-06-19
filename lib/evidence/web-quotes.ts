import type { PainQuote } from '@/lib/schemas';
import type { EvidenceSource } from '@/types/validate.types';
import {
  fetchRedditCommentsForThreads,
  searchRedditComments,
} from './reddit-comments';
import type { RedditComment } from './reddit-comments';
import { truncateAtWord } from './quote-pool';
import {
  BLOCKED_DOMAINS,
  EDITORIAL_DOMAINS,
  matchesDomainSuffix,
} from './domains';

const TAVILY_URL = 'https://api.tavily.com/search';
const MAX_RESULTS_PER_QUERY = 10;
// Short, sharp complaints ("App keeps crashing, useless") are real evidence,
// so keep the floor low — junk is caught by the other filters below.
const MIN_SNIPPET_LENGTH = 40;
// Stored/displayed quote length. The LLM prompt truncates separately
// (buildThemeClusterMessages), so longer storage costs no tokens.
const MAX_QUOTE_LENGTH = 1000;
const MAX_REDDIT_THREADS = 12;
const MAX_REDDIT_COMMENT_QUOTES = 35;

// Blog-style paths on arbitrary domains are vendor/editorial content
// (dragonflyai.co/blog/…), not people complaining. Review paths are kept
// OUT of this list — review pages are exactly where complaints live.
const BLOG_PATH_RE =
  /\/(blog|blogs|article|articles|post|posts|news|insights|resources|guide|guides)\b/i;

// Titles shaped like articles or listicles rather than discussions.
const EDITORIAL_TITLE_RE =
  /^(the\s+)?(\d+\s+)?(best|top\s+\d+|pitfalls?\s+of|ultimate|complete|essential|definitive)\b|(\bguide\s+to\b)|(\d+\s+ways\s+to\b)|(\bwhy\s+you(r)?\s+should\b)|(\bhow\s+to\s+choose\b)|(^review:)|(\bvs\.?\s)/i;

// Snippets dominated by sales copy are marketing pages, not complaints.
const PROMO_SIGNALS = [
  'add to cart',
  'free shipping',
  'buy now',
  'shop now',
  'free trial',
  'sign up today',
  'get started for free',
  'pricing starts at',
  'try it free',
  'no credit card required',
  'book a demo',
  'request a demo',
];

const REDDIT_SHELL_SIGNALS = [
  'open menu',
  'open navigation',
  'go to reddit home',
  'get app',
  'log in',
  'sign up',
];

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface CleanedResult extends TavilyResult {
  cleaned: string;
}

const LEADING_NAV_JUNK =
  /^(?:skip to (?:main )?content|open menu|close menu|menu|navigation|search|summary|tl;dr)\b[\s.:|–-]*/i;

function normalizedTitle(title: string): string {
  return title
    .replace(/\s*[:|–-]\s*r\/.*$/i, '')
    .replace(/\s*[|–-]\s*reddit$/i, '')
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tavily excerpts often start with navigation junk, markdown headings, and
// one or more copies of the page title.
export function cleanSnippet(content: string, title: string): string {
  let text = (content ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/#{1,6}\s*/g, ' ')
    .replace(/\bskip to (?:main )?content/gi, ' ')
    .replace(/\[([^\]]*)\]\(https?:\/\/[^)]+\)/gi, '$1')
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/\bopen menu\b/gi, ' ')
    .replace(/\bopen navigation\b/gi, ' ')
    .replace(/\bgo to reddit home\b/gi, ' ')
    .replace(/\bget app\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const coreTitle = normalizedTitle(title);

  let changed = true;
  while (changed) {
    const before = text;
    text = text.replace(LEADING_NAV_JUNK, '').trim();
    if (
      coreTitle.length >= 10 &&
      text.toLowerCase().startsWith(coreTitle.toLowerCase())
    ) {
      text = text.slice(coreTitle.length).replace(/^[\s.:!?|–-]+/, '').trim();
    }
    changed = text !== before;
  }

  return text;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function buildSourceLabel(url: string): string {
  const host = hostname(url);
  if (host.endsWith('reddit.com')) {
    const match = /\/r\/([^/]+)/.exec(url);
    return match ? `Reddit r/${match[1]}` : 'Reddit';
  }
  return host;
}

function urlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

export function isQuotable(result: CleanedResult): boolean {
  const host = hostname(result.url);
  if (matchesDomainSuffix(host, BLOCKED_DOMAINS)) return false;
  if (result.cleaned.length < MIN_SNIPPET_LENGTH) return false;
  const lower = result.cleaned.toLowerCase();
  // A genuine complaint can mention one promo phrase ("the free trial ended
  // and it still crashes"); only reject when sales copy clearly dominates.
  if (PROMO_SIGNALS.filter((s) => lower.includes(s)).length >= 2) return false;

  const isReddit = host.endsWith('reddit.com');
  if (
    isReddit &&
    REDDIT_SHELL_SIGNALS.filter((s) => lower.includes(s)).length >= 2
  ) {
    return false;
  }
  if (!isReddit) {
    if (matchesDomainSuffix(host, EDITORIAL_DOMAINS)) return false;
    if (BLOG_PATH_RE.test(urlPath(result.url))) return false;
    if (EDITORIAL_TITLE_RE.test(normalizedTitle(result.title))) return false;
  }
  return true;
}

async function searchOne(query: string): Promise<TavilyResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: 'advanced',
        max_results: MAX_RESULTS_PER_QUERY,
        include_answer: false,
        include_raw_content: false,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

function snippetQuote(result: CleanedResult): PainQuote {
  return {
    text: truncateAtWord(result.cleaned, MAX_QUOTE_LENGTH),
    source: hostname(result.url).endsWith('reddit.com') ? 'reddit' : 'web',
    sourceLabel: buildSourceLabel(result.url),
    url: result.url,
  };
}

function commentQuote(comment: RedditComment): PainQuote {
  return {
    text: truncateAtWord(comment.body, MAX_QUOTE_LENGTH),
    source: 'reddit',
    sourceLabel: comment.subreddit ? `Reddit r/${comment.subreddit}` : 'Reddit',
    author: comment.author,
    url: comment.permalink,
  };
}

// Real comments (with authors) for the Reddit threads Tavily found, plus a
// direct archive search for the problem keywords. Threads where the archive
// has nothing fall back to the search snippet.
async function collectRedditQuotes(
  threads: CleanedResult[],
  commentQuery: string | undefined
): Promise<PainQuote[]> {
  const [commentBatches, searched] = await Promise.all([
    fetchRedditCommentsForThreads(threads.map((t) => t.url)),
    commentQuery ? searchRedditComments(commentQuery) : Promise.resolve([]),
  ]);

  const quotes: PainQuote[] = [];
  const seenPermalinks = new Set<string>();
  let commentQuotes = 0;

  const addComment = (comment: RedditComment) => {
    if (commentQuotes >= MAX_REDDIT_COMMENT_QUOTES) return;
    if (seenPermalinks.has(comment.permalink)) return;
    seenPermalinks.add(comment.permalink);
    quotes.push(commentQuote(comment));
    commentQuotes += 1;
  };

  for (let i = 0; i < threads.length; i += 1) {
    const comments = commentBatches[i];
    if (comments.length === 0) {
      quotes.push(snippetQuote(threads[i]));
      continue;
    }
    comments.forEach(addComment);
  }
  searched.forEach(addComment);

  return quotes;
}

export async function searchPainQuotes(
  queries: string[],
  commentQuery?: string
): Promise<{ quotes: PainQuote[]; sources: EvidenceSource[] }> {
  const batches = await Promise.all(queries.map(searchOne));

  const seen = new Set<string>();
  const redditThreads: CleanedResult[] = [];
  const webResults: CleanedResult[] = [];
  const sources: EvidenceSource[] = [];

  for (const batch of batches) {
    for (const raw of batch) {
      const result: CleanedResult = {
        ...raw,
        cleaned: cleanSnippet(raw.content, raw.title),
      };
      if (seen.has(result.url) || !isQuotable(result)) continue;
      seen.add(result.url);

      const isReddit = hostname(result.url).endsWith('reddit.com');
      if (isReddit && redditThreads.length < MAX_REDDIT_THREADS) {
        redditThreads.push(result);
      } else if (!isReddit) {
        webResults.push(result);
      }
      sources.push({
        name: result.title,
        url: result.url,
        source: hostname(result.url),
        kind: 'web',
      });
    }
  }

  const redditQuotes = await collectRedditQuotes(redditThreads, commentQuery);
  const quotes = [...redditQuotes, ...webResults.map(snippetQuote)];

  return { quotes, sources };
}

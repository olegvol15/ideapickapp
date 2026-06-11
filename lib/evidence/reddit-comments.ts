// Reddit's own JSON API requires OAuth, so comments come from the
// PullPush.io community archive. It can lag or go down — callers must
// treat an empty result as "fall back to the search snippet".
const PULLPUSH_URL = 'https://api.pullpush.io/reddit/search/comment/';
// link_id lookups are indexed and fast; free-text search takes ~25-30s
// on PullPush's side (measured), so it gets its own generous timeout.
const THREAD_TIMEOUT_MS = 8_000;
const SEARCH_TIMEOUT_MS = 35_000;
const COMMENTS_PER_THREAD = 5;
const PULLPUSH_CONCURRENCY = 4;
const SEARCH_FETCH_SIZE = 30;
const SEARCH_RESULT_LIMIT = 15;
const MIN_BODY_LENGTH = 40;

let activeRequests = 0;
const waitingRequests: Array<() => void> = [];

async function acquirePullPushSlot(): Promise<() => void> {
  if (activeRequests < PULLPUSH_CONCURRENCY) {
    activeRequests += 1;
  } else {
    await new Promise<void>((resolve) => waitingRequests.push(resolve));
  }

  let released = false;

  return () => {
    if (released) return;
    released = true;
    const next = waitingRequests.shift();
    if (next) {
      // Transfer the occupied slot directly to the next waiter.
      next();
    } else {
      activeRequests -= 1;
    }
  };
}

export interface RedditComment {
  author: string;
  body: string;
  subreddit: string;
  permalink: string;
}

interface PullPushComment {
  author?: string;
  body?: string;
  subreddit?: string;
  permalink?: string;
  id?: string;
  link_id?: string;
  score?: number;
}

export function extractThreadId(threadUrl: string): string | null {
  const match = /\/comments\/([a-z0-9]+)/i.exec(threadUrl);
  return match ? match[1] : null;
}

function isUsable(comment: PullPushComment): boolean {
  const body = (comment.body ?? '').trim();
  const author = comment.author ?? '';
  if (body.length < MIN_BODY_LENGTH) return false;
  if (body === '[deleted]' || body === '[removed]') return false;
  if (!author || author === '[deleted]' || author === 'AutoModerator') {
    return false;
  }
  return true;
}

function buildPermalink(
  comment: PullPushComment,
  threadId: string
): string {
  if (comment.permalink) return `https://www.reddit.com${comment.permalink}`;
  const thread = threadId || (comment.link_id ?? '').replace(/^t3_/, '');
  return `https://www.reddit.com/comments/${thread}/comment/${comment.id ?? ''}`;
}

async function fetchPullPush(
  params: string,
  limit: number,
  timeoutMs: number,
  threadId = ''
): Promise<RedditComment[]> {
  const release = await acquirePullPushSlot();
  try {
    const res = await fetch(`${PULLPUSH_URL}?${params}`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const comments: PullPushComment[] = data?.data ?? [];

    return comments
      .filter(isUsable)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit)
      .map((c) => ({
        author: c.author ?? '',
        body: (c.body ?? '').trim(),
        subreddit: c.subreddit ?? '',
        permalink: buildPermalink(c, threadId),
      }));
  } catch {
    return [];
  } finally {
    release();
  }
}

export async function fetchRedditComments(
  threadUrl: string
): Promise<RedditComment[]> {
  const threadId = extractThreadId(threadUrl);
  if (!threadId) return [];
  return fetchPullPush(
    `link_id=${threadId}&size=25`,
    COMMENTS_PER_THREAD,
    THREAD_TIMEOUT_MS,
    threadId
  );
}

export async function fetchRedditCommentsForThreads(
  threadUrls: string[]
): Promise<RedditComment[][]> {
  return Promise.all(threadUrls.map(fetchRedditComments));
}

// Searches Reddit's entire comment archive for the problem keywords —
// finds complaints in threads Tavily never surfaced.
export async function searchRedditComments(
  query: string
): Promise<RedditComment[]> {
  if (!query.trim()) return [];
  return fetchPullPush(
    `q=${encodeURIComponent(query.trim())}&size=${SEARCH_FETCH_SIZE}`,
    SEARCH_RESULT_LIMIT,
    SEARCH_TIMEOUT_MS
  );
}

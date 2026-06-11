import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchRedditCommentsForThreads,
  searchRedditComments,
} from './reddit-comments';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PullPush concurrency', () => {
  it('caps thread and keyword requests at four globally', async () => {
    let active = 0;
    let maxActive = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        const url = String(input);
        const id = new URL(url).searchParams.get('link_id') ?? 'search';

        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;

        return new Response(
          JSON.stringify({
            data: [
              {
                id: `comment-${id}`,
                link_id: `t3_${id}`,
                author: `author-${id}`,
                body: `This is a sufficiently long complaint body for ${id}.`,
                subreddit: 'testing',
                score: 1,
              },
            ],
          }),
          { status: 200 }
        );
      })
    );

    const threadUrls = Array.from(
      { length: 8 },
      (_, index) => `https://www.reddit.com/r/testing/comments/id${index}/post`
    );
    const [threads, searched] = await Promise.all([
      fetchRedditCommentsForThreads(threadUrls),
      searchRedditComments('test query'),
    ]);

    expect(maxActive).toBe(4);
    expect(threads).toHaveLength(8);
    expect(threads.map((comments) => comments[0]?.author)).toEqual(
      threadUrls.map((_, index) => `author-id${index}`)
    );
    expect(searched[0]?.author).toBe('author-search');
  });

  it('releases a slot after request failures', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) throw new Error('network failure');
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      })
    );

    const results = await fetchRedditCommentsForThreads([
      'https://www.reddit.com/r/testing/comments/first/post',
      'https://www.reddit.com/r/testing/comments/second/post',
      'https://www.reddit.com/r/testing/comments/third/post',
      'https://www.reddit.com/r/testing/comments/fourth/post',
      'https://www.reddit.com/r/testing/comments/fifth/post',
    ]);

    expect(calls).toBe(5);
    expect(results).toHaveLength(5);
  });
});

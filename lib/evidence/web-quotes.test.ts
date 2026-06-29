import { describe, expect, it } from 'vitest';
import { cleanSnippet, isQuotable, isXPostUrl, xSnippetQuote } from './web-quotes';

describe('cleanSnippet', () => {
  it('removes headings, navigation junk, and repeated titles', () => {
    expect(
      cleanSnippet(
        '# Currently job hunting\nSkip to main content Currently job hunting Currently job hunting I hate copying every application into a spreadsheet.',
        'Currently job hunting : r/jobs'
      )
    ).toBe('I hate copying every application into a spreadsheet.');
  });

  it('removes Reddit shell links and attached navigation text', () => {
    expect(
      cleanSnippet(
        '[ ](https://www.reddit.com/r/jobsearch/comments/abc) Skip to main contentHow do you track applications? Open menu Open navigation Go to Reddit Home Get App',
        'How do you track applications? : r/jobsearch'
      )
    ).toBe('');
  });

  it('preserves legitimate complaint text', () => {
    expect(
      cleanSnippet(
        'My calendar loses billable entries whenever I switch devices, and support has not fixed it.',
        'Calendar sync problems'
      )
    ).toBe(
      'My calendar loses billable entries whenever I switch devices, and support has not fixed it.'
    );
  });

  it('strips Summary and TL;DR prefixes', () => {
    expect(
      cleanSnippet(
        'Summary: Despite improvements in AI design tools, output quality stays generic.',
        'AI design tool research'
      )
    ).toBe(
      'Despite improvements in AI design tools, output quality stays generic.'
    );
  });
});

describe('isQuotable editorial filtering', () => {
  const complaint =
    'I have been fighting this problem for months and nothing on the market actually fixes it for me.';
  const quotable = (url: string, title = 'Forum discussion') => ({
    title,
    url,
    content: complaint,
    cleaned: complaint,
  });

  it('rejects editorial platforms including subdomains', () => {
    expect(isQuotable(quotable('https://borism.medium.com/ai-design'))).toBe(
      false
    );
    expect(isQuotable(quotable('https://www.nngroup.com/articles/x'))).toBe(
      false
    );
  });

  it('rejects vendor blog paths on arbitrary domains', () => {
    expect(
      isQuotable(quotable('https://dragonflyai.co/blog/ai-design-limits'))
    ).toBe(false);
  });

  it('rejects listicle/article titles', () => {
    expect(
      isQuotable(
        quotable(
          'https://hemispheredm.com/ai-logo-design',
          'The Pitfalls of Using AI for Logo Design'
        )
      )
    ).toBe(false);
  });

  it('keeps Q&A and forum sources', () => {
    expect(
      isQuotable(
        quotable(
          'https://www.quora.com/Why-do-AI-design-tools-feel-generic',
          'Why do AI design tools feel generic?'
        )
      )
    ).toBe(true);
    expect(
      isQuotable(quotable('https://graphicdesignforum.com/t/ai-tools/123'))
    ).toBe(true);
  });

  it('keeps Reddit threads regardless of title shape', () => {
    expect(
      isQuotable(
        quotable(
          'https://www.reddit.com/r/design/comments/abc/best_ai_tools',
          'Best AI tools rant : r/design'
        )
      )
    ).toBe(true);
  });
});

describe('isQuotable relaxed filtering', () => {
  const base = (content: string, url = 'https://forum.example.com/t/1') => ({
    title: 'Forum discussion',
    url,
    content,
    cleaned: content,
  });

  it('keeps short but substantive complaints', () => {
    expect(isQuotable(base('App keeps crashing on every export, useless.'))).toBe(
      true
    );
  });

  it('still rejects snippets below the floor', () => {
    expect(isQuotable(base('too short'))).toBe(false);
  });

  it('keeps review pages — complaints live there', () => {
    expect(
      isQuotable(
        base(
          'Updated and now sync is completely broken, I have lost three days of entries.',
          'https://someapp.com/reviews/sync-broken'
        )
      )
    ).toBe(true);
  });

  it('tolerates a single promo phrase inside a complaint', () => {
    expect(
      isQuotable(
        base(
          'The free trial ended and the app still crashes constantly, total waste.'
        )
      )
    ).toBe(true);
  });

  it('rejects snippets dominated by sales copy', () => {
    expect(
      isQuotable(
        base(
          'Sign up today and start your free trial — no credit card required, book a demo now.'
        )
      )
    ).toBe(false);
  });
});

describe('xSnippetQuote', () => {
  const xResult = (url: string, cleaned = 'This tool keeps logging me out, infuriating.') => ({
    title: 'A post on X',
    url,
    content: cleaned,
    cleaned,
  });

  it('tags the source as x with an X label', () => {
    const quote = xSnippetQuote(xResult('https://x.com/janedev/status/123'));
    expect(quote.source).toBe('x');
    expect(quote.sourceLabel).toBe('X');
  });

  it('parses the handle from x.com and twitter.com URLs', () => {
    expect(
      xSnippetQuote(xResult('https://x.com/janedev/status/123')).author
    ).toBe('janedev');
    expect(
      xSnippetQuote(xResult('https://twitter.com/AnotherDev/status/9')).author
    ).toBe('anotherdev');
  });

  it('does not treat feature routes as handles', () => {
    expect(
      xSnippetQuote(xResult('https://x.com/search?q=broken+app')).author
    ).toBeUndefined();
    expect(
      xSnippetQuote(xResult('https://x.com/i/web/status/5')).author
    ).toBeUndefined();
  });
});

describe('isXPostUrl', () => {
  it('accepts real post (status) URLs', () => {
    expect(isXPostUrl('https://x.com/janedev/status/123')).toBe(true);
    expect(isXPostUrl('https://twitter.com/AnotherDev/status/9?s=20')).toBe(true);
  });

  it('rejects profile, bio, and search pages', () => {
    expect(isXPostUrl('https://x.com/ClementTV_')).toBe(false);
    expect(isXPostUrl('https://x.com/ashleyptaplin')).toBe(false);
    expect(isXPostUrl('https://x.com/search?q=math+app+broken')).toBe(false);
  });
});

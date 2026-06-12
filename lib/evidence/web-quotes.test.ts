import { describe, expect, it } from 'vitest';
import { cleanSnippet, isQuotable } from './web-quotes';

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

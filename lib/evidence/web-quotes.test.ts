import { describe, expect, it } from 'vitest';
import { cleanSnippet } from './web-quotes';

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
});

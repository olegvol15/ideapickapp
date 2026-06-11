import { describe, expect, it } from 'vitest';
import { PainQueryResponseSchema } from '@/lib/schemas';
import { buildPainQueryMessages } from './validate.prompts';

describe('validation query contract', () => {
  it('does not request App Store evidence for mobile ideas', () => {
    const messages = buildPainQueryMessages(
      'A mobile app for tracking water consumption',
      'Mobile App'
    );
    const prompt = messages.map((message) => message.content).join('\n');

    expect(prompt).not.toContain('appStoreKeywords');
    expect(prompt).not.toContain('App Store');
    expect(prompt).toContain('support community');
  });

  it('accepts the web-only query response shape', () => {
    expect(
      PainQueryResponseSchema.safeParse({
        problemStatement: 'I struggle to track my water consumption.',
        webQueries: [
          'site:reddit.com water tracking inaccurate frustrating',
          'water intake tracking difficult forum -site:reddit.com',
          'hydration logging annoying support -site:reddit.com',
          'remember water consumption discussion -site:reddit.com',
        ],
        commentQuery: 'track water intake',
      }).success
    ).toBe(true);
  });
});

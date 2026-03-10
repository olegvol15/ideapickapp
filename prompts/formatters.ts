import type { Competitor } from '@/types';

/**
 * Formats the competitor list into a structured text block for injection
 * into the LLM analysis prompt.
 */
export function formatCompetitorBlock(competitors: Competitor[]): string {
  if (!competitors.length) {
    return 'No competitors found. Use training knowledge for the competitive landscape.';
  }

  return competitors
    .map((c, i) => {
      const lines: string[] = [`${i + 1}. ${c.name} [${c.source}]`];

      if (c.platform && c.platform !== 'Web') {
        const meta: string[] = [c.platform];
        if (c.rating != null) meta.push(`★ ${c.rating}`);
        if (c.reviewCount != null)
          meta.push(`${c.reviewCount.toLocaleString()} ratings`);
        if (c.category) meta.push(c.category);
        lines.push(`   ${meta.join(' · ')}`);
      }

      if (c.pricingSignal) {
        lines.push(`   Pricing: ${c.pricingSignal}`);
      }

      lines.push(`   ${c.snippet}`);
      lines.push(`   ${c.url}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

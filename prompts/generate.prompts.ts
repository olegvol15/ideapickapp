import type { Competitor } from '@/types';
import {
  PRODUCT_TYPE_TERMS,
  DEFAULT_DIGITAL_TERMS,
  ECOSYSTEM_CONTEXT,
  RESPONSE_SCHEMA,
} from './constants';
import { formatCompetitorBlock } from './formatters';

type ChatMessage = { role: 'system' | 'user'; content: string };

export function buildQueryGenerationMessages(
  prompt: string,
  productType: string
): ChatMessage[] {
  const terms = PRODUCT_TYPE_TERMS[productType] ?? DEFAULT_DIGITAL_TERMS;

  return [
    {
      role: 'system',
      content: `You generate short, focused web search queries to discover SOFTWARE PRODUCTS in a market.
Only target apps, SaaS, platforms, and digital tools — never articles, YouTube videos, Reddit posts, or physical goods.
Output ONLY valid JSON: { "queries": ["query1", "query2", "query3"] }
Rules:
- 2–3 queries, each 3–6 words
- Every query must include a digital keyword (app, SaaS, software, tool, platform, AI)
- Search as if looking for a product to use, not a blog to read
- Bad: "best dance apps 2024", "top 10 SaaS tools"
- Good: "dance choreography app", "AI coaching platform"`,
    },
    {
      role: 'user',
      content: `User's goal: ${prompt}
Each query MUST include one of: ${terms.map((t) => `"${t}"`).join(', ')}.
Generate 2–3 queries to find real digital products in this market.`,
    },
  ];
}

export function buildAnalysisMessages(
  prompt: string,
  competitors: Competitor[],
  productType: string,
  difficulty: string
): ChatMessage[] {
  const competitorBlock = formatCompetitorBlock(competitors);

  const filterParts: string[] = [];
  if (productType) filterParts.push(`Product type: ${productType}`);
  if (difficulty) filterParts.push(`Difficulty: ${difficulty}`);
  const filterBlock = filterParts.length
    ? `\nConstraints: ${filterParts.join(', ')}`
    : '';

  const ecosystemBlock = ECOSYSTEM_CONTEXT[productType]
    ? `\n${ECOSYSTEM_CONTEXT[productType]}\n`
    : '';

  return [
    {
      role: 'system',
      content: `You are a startup opportunity analyst for DIGITAL SOFTWARE products only.

NEVER suggest physical goods, ecommerce stores, or hardware. If the market touches physical goods, redirect toward the software layer: apps, platforms, AI tools, SaaS, workflow tools.

Ground every insight in the provided competitor data. Look for:
- Underserved audiences (solo builders, small teams, specific verticals)
- Tools that are too broad, expensive, or complex for a niche
- Outdated workflows ready for AI-first approaches
- Crowded categories with no niche winner
${ecosystemBlock}
For competitorAnalysis: analyze ONLY competitors from the provided list. Max 4. Be specific about strengths and weaknesses — no generic statements.
For marketContext: opportunityScore (1–100) reflects how strong the opportunity is based on competition gaps and demand. signals must be concrete trend observations.
For ideas: closestCompetitors must be names from the competitor list.

Respond ONLY with valid JSON. No markdown, no extra keys.

${RESPONSE_SCHEMA}`,
    },
    {
      role: 'user',
      content: `Goal: ${prompt}${filterBlock}

Competitors found (${competitors.length}):
${competitorBlock}

Analyze and generate 3 grounded digital product ideas.`,
    },
  ];
}

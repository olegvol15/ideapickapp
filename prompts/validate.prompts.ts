import type { Competitor } from '@/types';
import { formatCompetitorBlock } from './formatters';

type ChatMessage = { role: 'system' | 'user'; content: string };

export function buildValidationQueryMessages(
  description: string,
  productType: string,
  audience?: string,
  problem?: string
): ChatMessage[] {
  const context = [
    `Product type: ${productType}`,
    audience ? `Target audience: ${audience}` : null,
    problem ? `Problem it solves: ${problem}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    {
      role: 'system',
      content: `You generate web search queries for startup idea validation research.
Return a JSON object with exactly this shape:
{
  "competitorQueries": [
    "<query for direct competitor products or tools in this space>",
    "<query for alternative solutions or apps solving the same problem>"
  ],
  "signalQuery": "<query targeting forum discussions, Reddit posts, or reviews where real people express frustration or struggle with this problem>"
}
Queries must be specific, short (5-10 words), and use natural search phrasing.
Respond ONLY with valid JSON. No markdown.`,
    },
    {
      role: 'user',
      content: `Generate research queries for this idea:\n${description}\n\n${context}`,
    },
  ];
}

export function buildValidationAnalysisMessages(
  description: string,
  productType: string,
  audience: string | undefined,
  problem: string | undefined,
  competitors: Competitor[]
): ChatMessage[] {
  const context = [
    `Product type: ${productType}`,
    audience ? `Target audience: ${audience}` : null,
    problem ? `Problem it solves: ${problem}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const competitorBlock = formatCompetitorBlock(competitors);

  return [
    {
      role: 'system',
      content: `You are a startup idea validator with access to real web research results.
Analyze the idea and web evidence, then return a JSON validation report:
{
  "score": <integer 0-100, overall viability>,
  "painScore": <integer 0-100, how real and evidenced the problem is>,
  "competitionScore": <integer 0-100, market saturation — lower = less saturated = better>,
  "opportunityScore": <integer 0-100, differentiation gap and timing>,
  "signals": ["<positive signal 1>", "<positive signal 2>", "<positive signal 3>"],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "verdict": "<2-3 sentences: honest assessment of viability based on the evidence>"
}
Be honest and grounded in the web evidence. Use the competitor data to inform scores.
Respond ONLY with valid JSON. No markdown.`,
    },
    {
      role: 'user',
      content: `Validate this idea:
${description}

${context}

--- Web Research Results ---
${competitorBlock}`,
    },
  ];
}

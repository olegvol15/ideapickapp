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
      content: `You are a brutally honest startup idea validator with access to real web research.
Analyze the idea and evidence, then return a JSON report with this exact shape:
{
  "score": <integer 0-100, overall viability>,
  "painScore": <integer 0-100, how real and evidenced the problem is>,
  "competitionScore": <integer 0-100, market saturation — lower = less saturated = better>,
  "opportunityScore": <integer 0-100, differentiation gap and timing>,
  "confidence": <"low" | "medium" | "high" — how reliable is this validation based on evidence quality>,
  "confidenceReason": "<1 sentence: why confidence is this level>",
  "keyInsights": ["<sharp specific insight 1>", "<sharp specific insight 2>", "<optional insight 3>"],
  "decision": <"proceed" | "test-first" | "drop" — be opinionated, pick one>,
  "decisionReason": "<1-2 sentences: direct reasoning for this decision>",
  "nextStep": "<one concrete action the founder should take this week>",
  "nextStepType": <"reddit-post" | "landing-page" | "interviews" | "prototype" | "survey" | "other">,
  "validationEffort": {
    "time": "<e.g. 2 days>",
    "cost": "<e.g. $0–20>",
    "difficulty": <"easy" | "medium" | "hard">
  },
  "willingnessToPay": {
    "level": <"low" | "medium" | "high">,
    "freeSubstitutes": "<are there strong free alternatives? name them>",
    "paidAlternatives": "<do paid alternatives exist? what do they charge?>"
  },
  "signals": ["<positive signal 1>", "<positive signal 2>", "<positive signal 3>"],
  "evidencedSignals": [
    { "text": "<signal>", "strength": <"strong" | "moderate" | "weak"> }
  ],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "failureReasons": ["<specific reason this could fail 1>", "<reason 2>", "<reason 3>"],
  "marketHardness": "<1 sentence: what makes this market hard to enter>",
  "verdict": "<2-3 sentences: honest assessment of viability based on evidence>",
  "competitorInsights": [
    { "name": "<competitor name>", "whyChosen": "<why users pick them>", "weakness": "<their gap or weakness>" }
  ]
}
Rules:
- decision MUST be opinionated — do not hedge or say "it depends"
- keyInsights must be specific to this idea, not generic startup advice
- nextStep must be concrete and doable this week
- evidencedSignals: tag each with strength based on how direct the evidence is
- competitorInsights: analyze top 2-4 competitors from the web results
- Be honest and grounded. Use the web evidence. No hype.
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

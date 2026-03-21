import type { Competitor } from '@/types';
import { formatCompetitorBlock } from './formatters';

type ChatMessage = { role: 'system' | 'user'; content: string };

const PRODUCT_SEARCH_CONSTRAINT: Record<string, string> = {
  'Mobile App': 'Queries MUST target mobile apps only. Include terms like "app", "iOS app", "Android app", or "App Store". Never return websites, articles, resource lists, or SaaS tools.',
  'SaaS': 'Queries MUST target SaaS products or web platforms only. Include terms like "software", "platform", "SaaS", or "web app". Never return mobile apps or article lists.',
  'AI Tool': 'Queries MUST target AI-powered tools or products. Include terms like "AI tool", "GPT", "AI software", or "AI platform". Never return general articles or non-AI products.',
  'Chrome Extension': 'Queries MUST target browser extensions only. Include terms like "chrome extension", "browser extension", or "add-on". Never return mobile apps or general web tools.',
  'Dev Tool': 'Queries MUST target developer tools only. Include terms like "developer tool", "CLI", "SDK", "library", "API tool", or "open source". Never return non-technical products.',
};

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
${PRODUCT_SEARCH_CONSTRAINT[productType] ?? ''}
Respond ONLY with valid JSON. No markdown.`,
    },
    {
      role: 'user',
      content: `Generate research queries for this idea:\n${description}\n\n${context}`,
    },
  ];
}

export function buildCompetitorMessages(
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
      content: `You are an expert in the startup and app ecosystem with deep knowledge of existing products.
Given a startup idea and product type, identify the top 3–4 most successful, well-known direct competitors that already exist in the market.
Return a JSON object with this exact shape:
{
  "competitors": [
    {
      "name": "<exact product name>",
      "url": "<product's own official website URL>",
      "source": "<domain without www, e.g. todoist.com>",
      "snippet": "<1–2 sentences: what this product does and why users choose it>"
    }
  ]
}
Rules:
- Return ONLY real, well-known products that actually exist and are in active use
- For Mobile App: return actual apps (e.g. Todoist, TickTick, Headspace) — NOT app store category pages or articles
- For SaaS: return actual SaaS platforms with their own website URLs (e.g. notion.so, linear.app)
- For Chrome Extension: return actual browser extensions (e.g. Grammarly, Honey)
- For Dev Tool: return actual developer tools (e.g. Sentry, Datadog, Vercel)
- For AI Tool: return actual AI-powered products (e.g. Jasper, Copy.ai, Perplexity)
- url must be the product's own website homepage (e.g. https://todoist.com) — never a store category page or article
- source is the bare domain (e.g. "todoist.com")
- snippet must describe the product itself — not an article, not a review
Respond ONLY with valid JSON. No markdown.`,
    },
    {
      role: 'user',
      content: `Find the top direct competitors for this idea:\n${description}\n\n${context}`,
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
  ],
  "whereToWin": [
    {
      "title": "<gap type label — must be one of: Segment gap, Timing gap, Complexity gap, Pricing gap, Workflow gap, Trust gap, Niche gap, Distribution gap>",
      "pattern": "<what existing competitors optimize for — 1 short phrase>",
      "gap": "<what they ignore or do poorly — 1 short phrase, specific>",
      "opportunity": "<specific opening for this idea — 1 concrete sentence, testable>"
    }
  ]
}
COPY RULES — follow exactly, no exceptions:
- decision: pick one, no hedging. If uncertain, pick "test-first".
- decisionReason: max 15 words. No "it's essential to", no "users are increasingly", no "in today's market". Write like a blunt investor. Example: "Crowded market. No clear moat. Differentiation is weak."
- keyInsights: max 1 sentence each. Must contain a specific claim (number, name, or direct observation). BAD: "There is growing demand for this type of solution." GOOD: "3 funded competitors exist — Notion, Coda, Outline — all targeting the same segment."
- confidenceReason: 1 sentence, no filler. State the actual limitation or strength. BAD: "The evidence quality is moderate due to limited data." GOOD: "Only 2 search results matched — thin data."
- nextStep: name a specific number or platform. BAD: "Talk to potential users." GOOD: "Post in r/productivity asking if people pay for X — target 20 upvotes in 48h."
- competitorInsights.whyChosen: 1 short phrase — what users actually get. Examples: "free tier + integrations", "best-in-class UX", "cheapest option"
- competitorInsights.weakness: 1 short phrase — the gap. Examples: "expensive", "no mobile app", "limited to B2B"
- failureReasons: max 6 words per item. Direct. Examples: "Crowded — 10+ funded alternatives", "Low WTP in this segment", "Hard to reach niche audience"
- risks: same as failureReasons — short, brutal, specific
- evidencedSignals: tag each with strength based on how direct the evidence is
- marketHardness: 1 sentence, name the actual barrier (e.g. "CAC is high because Google Ads CPCs for this keyword are $8–15")
- verdict: max 2 sentences. No fluff. State what the data says.
- whereToWin: 2–3 items only. Each must describe a real, observable pattern from the competitor data — not generic advice. BANNED: "better UX", "add AI", "more features", "faster", "better personalization". title must be a gap type from the allowed list. pattern and gap must be factual and short (under 10 words each). opportunity must name a specific segment, channel, use-case, or behavior — not vague improvement.
- nextStep: if whereToWin has insights, the nextStep must specifically test the angle in whereToWin[0].opportunity — not a generic validation step.
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

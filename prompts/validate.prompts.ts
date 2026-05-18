import type { Competitor } from '@/types';
import type { AppStoreReview } from '@/lib/discovery/mobile';
import type {
  MobileMetrics,
  MobileScores,
  MobileDecision,
  PainAnalysis,
  NicheResult,
  WinAngle,
} from '@/lib/scoring/mobile';
import { formatCompetitorBlock } from './formatters';

type ChatMessage = { role: 'system' | 'user'; content: string };

const PRODUCT_SEARCH_CONSTRAINT: Record<string, string> = {
  'Mobile App':
    'Queries MUST target mobile apps only. Include terms like "app", "iOS app", "Android app", or "App Store". Never return websites, articles, resource lists, or SaaS tools.',
  SaaS: 'Queries MUST target SaaS products or web platforms only. Include terms like "software", "platform", "SaaS", or "web app". Never return mobile apps or article lists.',
  'AI Tool':
    'Queries MUST target AI-powered tools or products. Include terms like "AI tool", "GPT", "AI software", or "AI platform". Never return general articles or non-AI products.',
  'Chrome Extension':
    'Queries MUST target browser extensions only. Include terms like "chrome extension", "browser extension", or "add-on". Never return mobile apps or general web tools.',
  'Dev Tool':
    'Queries MUST target developer tools only. Include terms like "developer tool", "CLI", "SDK", "library", "API tool", or "open source". Never return non-technical products.',
};

export function buildValidationQueryMessages(
  description: string,
  productType: string,
  audience?: string,
  problem?: string,
  monetization?: string
): ChatMessage[] {
  const context = [
    `Product type: ${productType}`,
    audience ? `Target audience: ${audience}` : null,
    problem ? `Problem it solves: ${problem}` : null,
    monetization ? `Monetization model: ${monetization}` : null,
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
      content: `Generate research queries for this idea:\n<user_input>\n${description}\n</user_input>\n\n${context}`,
    },
  ];
}

export function buildCompetitorMessages(
  description: string,
  productType: string,
  audience?: string,
  problem?: string,
  monetization?: string
): ChatMessage[] {
  const context = [
    `Product type: ${productType}`,
    audience ? `Target audience: ${audience}` : null,
    problem ? `Problem it solves: ${problem}` : null,
    monetization ? `Monetization model: ${monetization}` : null,
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
      content: `Find the top direct competitors for this idea:\n<user_input>\n${description}\n</user_input>\n\n${context}`,
    },
  ];
}

export function buildValidationAnalysisMessages(
  description: string,
  productType: string,
  audience: string | undefined,
  problem: string | undefined,
  competitors: Competitor[],
  monetization?: string
): ChatMessage[] {
  const context = [
    `Product type: ${productType}`,
    audience ? `Target audience: ${audience}` : null,
    problem ? `Problem it solves: ${problem}` : null,
    monetization ? `Monetization model: ${monetization}` : null,
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
  "competitionScore": <integer 0-100, how crowded the market is — 0 = wide open, almost no competition; 100 = extremely saturated, dominated by funded players. Todo apps = 90. A truly novel niche = 10>,
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
  "scoreBreakdown": {
    "pain": [
      { "label": "Urgency", "score": <integer 0-100> },
      { "label": "Frequency", "score": <integer 0-100> },
      { "label": "Evidence", "score": <integer 0-100> }
    ],
    "competition": [
      { "label": "Saturation", "score": <integer 0-100> },
      { "label": "Incumbents", "score": <integer 0-100> },
      { "label": "Switching Cost", "score": <integer 0-100> }
    ],
    "opportunity": [
      { "label": "Gap Clarity", "score": <integer 0-100> },
      { "label": "Monetization", "score": <integer 0-100> },
      { "label": "Reachability", "score": <integer 0-100> }
    ]
  },
  "willingnessToPay": {
    "level": <"low" | "medium" | "high">,
    "freeSubstitutes": "<are there strong free alternatives? name them>",
    "paidAlternatives": "<do paid alternatives exist? what do they charge? If a monetization model is provided, use it to ground your assessment>"
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
- scoreBreakdown: always include exactly 3 sub-scores for pain, 3 for competition, and 3 for opportunity using the labels above. The average of each group should roughly match painScore, competitionScore, and opportunityScore.
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
IDEA-SPECIFIC RULES — every text field must feel specific to THIS idea, not reusable:
- signals, risks, failureReasons: each must reference the idea's use case, audience, or core feature. NEVER write a statement that could apply to any product in any market.
- BANNED phrases: "Users are increasingly looking for", "The market is growing", "There is demand for", "alternatives exist"
- verdict: must name the specific idea or its core concept at least once
- competitorInsights.weakness: explain concretely how THIS idea could exploit each competitor weakness (e.g. "has no mobile app → [this idea] targets mobile-first users [competitor] ignores")
- whereToWin.opportunity: frame each opening in terms of what THIS idea does or who it serves — not "focus on X segment" but how THIS idea's specific feature or audience positions it to win
Respond ONLY with valid JSON. No markdown.`,
    },
    {
      role: 'user',
      content: `Validate this idea:
<user_input>
${description}
</user_input>

${context}

--- Web Research Results ---
${competitorBlock}`,
    },
  ];
}

function buildReviewBlock(
  competitorReviews: Map<string, AppStoreReview[]>
): string {
  const sections: string[] = [];
  for (const [appName, reviews] of competitorReviews) {
    if (reviews.length === 0) continue;
    const complaints = reviews
      .filter((r) => r.rating <= 3)
      .slice(0, 5)
      .map((r) => `  • "${r.title}: ${r.body.slice(0, 120)}"`)
      .join('\n');
    const positives = reviews
      .filter((r) => r.rating >= 4)
      .slice(0, 3)
      .map((r) => `  • "${r.title}: ${r.body.slice(0, 120)}"`)
      .join('\n');
    if (!complaints && !positives) continue;
    const lines = [`${appName} — real App Store reviews:`];
    if (complaints) lines.push(`  Complaints (★1–3):\n${complaints}`);
    if (positives) lines.push(`  Positives (★4–5):\n${positives}`);
    sections.push(lines.join('\n'));
  }
  if (sections.length === 0) return '';
  return `\n--- Real App Store Reviews (ground competitorInsights in these) ---\n${sections.join('\n\n')}`;
}

export function buildMobileAnalysisMessages(
  description: string,
  productType: string,
  audience: string | undefined,
  problem: string | undefined,
  competitors: Competitor[],
  metrics: MobileMetrics,
  scores: MobileScores,
  uiScores: {
    score: number;
    painScore: number;
    competitionScore: number;
    opportunityScore: number;
  },
  rawDecision: MobileDecision,
  decisionReason: string,
  pain: PainAnalysis,
  marketInsights: string[],
  opportunityInsights: string[],
  winAngles: WinAngle[],
  confidenceScore: number,
  monetization?: string,
  competitorReviews?: Map<string, AppStoreReview[]>
): ChatMessage[] {
  const context = [
    `Product type: ${productType}`,
    audience ? `Target audience: ${audience}` : null,
    problem ? `Problem it solves: ${problem}` : null,
    monetization ? `Monetization model: ${monetization}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const competitorBlock = formatCompetitorBlock(competitors);
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  const metricsBlock = `App Store distribution metrics (computed from ${metrics.totalApps} apps):
- top10AvgRating: ${(metrics.top10AvgRating ?? 0).toFixed(2)} (top apps by review volume)
- bottom40AvgRating: ${(metrics.bottom40AvgRating ?? 0).toFixed(2)} (weaker apps)
- medianRating: ${(metrics.medianRating ?? 0).toFixed(2)}
- top1ReviewShare: ${pct(metrics.top1ReviewShare ?? 0)} (market leader concentration)
- top5ReviewShare: ${pct(metrics.top5ReviewShare ?? 0)}
- top10ReviewShare: ${pct(metrics.top10ReviewShare ?? 0)}
- reviewDistributionSkew (Gini): ${(metrics.reviewDistributionSkew ?? 0).toFixed(2)} (0=equal, 1=winner-takes-all)
- marketDominance: ${metrics.marketDominance ?? 'LOW'}
- marketLocked: ${metrics.marketLocked ?? false}

Pain analysis (weighted score ${pain.weightedScore}/10):
${
  pain.topPainClusters.length > 0
    ? pain.topPainClusters
        .map((c) => `- ${c.cluster}: ${c.share}% of signals`)
        .join('\n')
    : '- No strong pain clusters detected'
}

Engine scores (0–10):
- competitionScore: ${scores.competitionScore}
- saturationScore: ${scores.saturationScore}
- qualityBarrierScore: ${scores.qualityBarrierScore}
- marketPowerScore: ${scores.marketPowerScore}
- opportunityScore: ${scores.opportunityScore}

Final decision: ${rawDecision} — ${decisionReason}
Confidence score: ${confidenceScore}/100
UI scores (0–100): score=${uiScores.score}, painScore=${uiScores.painScore}, competitionScore=${uiScores.competitionScore}, opportunityScore=${uiScores.opportunityScore}

Pre-computed market insights (use these — do not rephrase differently):
${marketInsights.map((s) => `• ${s}`).join('\n') || '• Insufficient data for market insights'}

Pre-computed opportunity insights:
${opportunityInsights.map((s) => `• ${s}`).join('\n') || '• No strong opportunity signals detected'}

Pre-computed win angles (format these into whereToWin — do not invent new ones):
${winAngles.map((a, i) => `${i + 1}. [${a.title}] Signal: "${a.signal}" → Angle: "${a.angle}"`).join('\n') || 'None identified — use competitor gaps from evidence below'}`;

  return [
    {
      role: 'system',
      content: `You are a mobile market analyst writing a validation report for a founder.
All scores, the decision, market insights, opportunity insights, and win angles were computed deterministically from real App Store distribution data and weighted pain signals. Your job is to explain and narrate — not recompute or override.

STRICT RULES:
- DO NOT output: score, painScore, competitionScore, opportunityScore, decision
- keyInsights MUST be drawn from the pre-computed market and opportunity insights provided — rephrase each in terms of what it means for THIS specific idea, not just what the market data shows
- whereToWin MUST be formatted from the pre-computed win angles — format each into the JSON shape, do not add new angles
- confidence MUST reflect the provided confidence score (${confidenceScore < 40 ? 'low' : confidenceScore < 70 ? 'medium' : 'high'})
IDEA-SPECIFIC RULES:
- signals, risks, failureReasons, marketHardness: explain what the data means for THIS specific idea — not the market in isolation. Reference the idea's use case, audience, or core feature in each bullet.
- keyInsights: add what each pre-computed insight means for THIS idea (e.g. not "top 5 apps control 88%" but "top 5 apps control 88% — this idea enters with no brand recognition against incumbents with 10x more reviews")
- whereToWin.opportunity: explain how THIS idea's specific feature or target audience exploits the angle — not a generic "new entrant could..."
- competitorInsights.weakness: explain how THIS idea can capitalize on each gap given its stated audience or problem

Return a JSON object with exactly this shape:
{
  "signals": ["<positive market signal from the data>", "<signal 2>", "<signal 3>"],
  "risks": ["<risk derived from the metrics>", "<risk 2>", "<risk 3>"],
  "verdict": "<2 sentences: what the App Store distribution data says about this idea's viability — cite specific numbers>",
  "confidence": "${confidenceScore < 40 ? 'low' : confidenceScore < 70 ? 'medium' : 'high'}",
  "confidenceReason": "<1 sentence citing data coverage: ${metrics.totalApps} apps found, signal count>",
  "keyInsights": ["<rephrase market insight 1 from the provided list>", "<rephrase insight 2>", "<insight 3>"],
  "nextStep": "<one concrete action this week, naming a specific platform or number>",
  "nextStepType": <"reddit-post" | "landing-page" | "interviews" | "prototype" | "survey" | "other">,
  "validationEffort": { "time": "<e.g. 2 days>", "cost": "<e.g. $0–20>", "difficulty": <"easy" | "medium" | "hard"> },
  "scoreBreakdown": {
    "pain": [
      { "label": "Urgency", "score": <integer 0-100 roughly matching painScore ${uiScores.painScore}> },
      { "label": "Frequency", "score": <integer 0-100> },
      { "label": "Evidence", "score": <integer 0-100> }
    ],
    "competition": [
      { "label": "Saturation", "score": <integer 0-100 roughly matching competitionScore ${uiScores.competitionScore}> },
      { "label": "Incumbents", "score": <integer 0-100> },
      { "label": "Switching Cost", "score": <integer 0-100> }
    ],
    "opportunity": [
      { "label": "Gap Clarity", "score": <integer 0-100 roughly matching opportunityScore ${uiScores.opportunityScore}> },
      { "label": "Monetization", "score": <integer 0-100> },
      { "label": "Reachability", "score": <integer 0-100> }
    ]
  },
  "willingnessToPay": {
    "level": <"low" | "medium" | "high">,
    "freeSubstitutes": "<name strong free alternatives from competitor data>",
    "paidAlternatives": "<what do paid alternatives charge? cite names if known>"
  },
  "evidencedSignals": [{ "text": "<signal from pain or market data>", "strength": <"strong" | "moderate" | "weak"> }],
  "failureReasons": ["<max 6 words, direct, from metrics>", "<reason 2>"],
  "marketHardness": "<1 sentence naming the specific structural barrier from the data>",
  "competitorInsights": [
    { "name": "<app name>", "whyChosen": "<1 short phrase: what users get — use real review positives if provided>", "weakness": "<1 short phrase: the gap — if real App Store reviews are provided, derive this from actual complaint text, not general knowledge>" }
  ],
  "whereToWin": [
    {
      "title": "<gap type from pre-computed angles>",
      "pattern": "<what top apps optimize for — under 10 words, from data>",
      "gap": "<what the angle signal shows they ignore — under 10 words>",
      "opportunity": "<the pre-computed angle rephrased as a concrete testable opening>"
    }
  ]
}
COPY RULES:
- verdict: cite specific numbers (review share %, ratings, app count)
- keyInsights: MUST echo the pre-computed insights — do not substitute generic claims
- whereToWin: MUST be formatted from the pre-computed angles provided — 2-3 items
- failureReasons and risks: max 6 words each, blunt
- scoreBreakdown sub-scores should average close to their parent UI score
Respond ONLY with valid JSON. No markdown.`,
    },
    {
      role: 'user',
      content: `Write the validation report for this Mobile App idea:
${description}

${context}

Every insight you write must reference THIS specific idea — not the market in general. Name the idea's use case, audience, or core feature in signals, risks, failureReasons, and verdict.

--- Deterministic Engine Output ---
${metricsBlock}

--- App Store & Signal Evidence ---
${competitorBlock}${competitorReviews ? buildReviewBlock(competitorReviews) : ''}`,
    },
  ];
}

export function buildKeywordExpansionMessages(
  description: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You generate App Store search keywords for a mobile app idea.
Return a JSON object with this exact shape:
{
  "base": "<the most direct 2-5 word App Store search term for this specific idea>",
  "variations": ["<same specificity, different angle — 2-5 words>", "<variation 2>", "<variation 3>"],
  "niches": ["<narrower: same core concept + specific audience or use case — 3-6 words>", "<niche 2>", "<niche 3>"]
}

CRITICAL RULES — read carefully:
- NEVER make any keyword more generic or broader than the original idea.
- base: the most natural search term a user would type to find THIS specific app. Must include the core concept (e.g. the main function or domain). NOT a parent category.
- variations: same level of specificity as base, approached from a different angle or synonym. Must still include the core concept.
- niches: strictly MORE specific than base. Narrow by audience (e.g. "for beginners", "for ADHD") OR use case (e.g. "at home", "for ecommerce"). Must still contain the core concept.
- All terms must be realistic App Store search queries (2-6 words max).
- Never use product names, brand names, or vague terms like "better app" or "easy app".

BAD (too broad / drops core concept):
  idea: "makeup simulator with AR try-on"  →  base: "beauty app"  ✗
  idea: "habit tracker for ADHD users"     →  niche: "productivity app"  ✗

GOOD (preserves or narrows):
  idea: "makeup simulator with AR try-on"  →  base: "makeup AR try-on", niche: "makeup simulator for beginners"  ✓
  idea: "habit tracker for ADHD users"     →  base: "ADHD habit tracker", niche: "ADHD daily routine tracker"  ✓

Respond ONLY with valid JSON. No markdown.`,
    },
    {
      role: 'user',
      content: `Generate App Store market keywords for this mobile app idea:\n${description}`,
    },
  ];
}

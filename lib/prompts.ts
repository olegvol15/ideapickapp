import type { Competitor } from "@/types";

// ─── Query Generation ─────────────────────────────────────────────────────────

// Maps product type selections to search-friendly terms
const PRODUCT_TYPE_TERMS: Record<string, string[]> = {
  "SaaS":             ["SaaS", "web app"],
  "AI Tool":          ["AI tool", "AI app"],
  "Mobile App":       ["mobile app", "iOS app", "Android app"],
  "Chrome Extension": ["Chrome extension", "browser extension"],
  "Dev Tool":         ["developer tool", "CLI tool"],
};

// Fallback terms when no product type is selected
const DEFAULT_DIGITAL_TERMS = ["software", "SaaS", "app"];

function getSearchTerms(productType: string): string[] {
  return PRODUCT_TYPE_TERMS[productType] ?? DEFAULT_DIGITAL_TERMS;
}

export function buildQueryGenerationMessages(
  prompt: string,
  productType: string
): { role: "system" | "user"; content: string }[] {
  const terms = getSearchTerms(productType);
  const termsHint = `Each query MUST include one of these product-type keywords: ${terms.map((t) => `"${t}"`).join(", ")}.`;

  return [
    {
      role: "system",
      content: `You generate short, focused web search queries to discover existing SOFTWARE products in a market.

IdeaPick is a digital-product tool. All queries must target software, apps, SaaS, or digital platforms — never physical goods, gear, ecommerce stores, or hardware.

Output ONLY a JSON object: { "queries": ["query1", "query2", "query3"] }

Rules:
- 2 to 3 queries maximum
- Each query must be 3–6 words
- Every query must include a software/digital keyword (app, SaaS, software, tool, platform, AI)
- Search like a user looking for a product to use, not to buy physically
- Bad example: "soccer training gear" or "running equipment shop"
- Good example: "soccer coaching app" or "sports training SaaS"`,
    },
    {
      role: "user",
      content: `User's goal: ${prompt}

${termsHint}

Generate 2–3 search queries to find existing digital products in this market.`,
    },
  ];
}

// ─── Market Analysis + Idea Generation ───────────────────────────────────────

const RESPONSE_SCHEMA = `{
  "marketContext": {
    "theme": "3-6 word phrase naming the market niche",
    "competitorsFound": <number — exact count provided>,
    "marketCondition": "one short phrase, e.g. 'crowded but fragmented' or 'emerging, few players'",
    "mainPatterns": [
      "concrete pattern observed across competitors",
      "concrete pattern observed across competitors",
      "concrete pattern observed across competitors"
    ]
  },
  "gaps": [
    {
      "title": "Short gap name, 3-5 words",
      "currentMarket": "what existing tools do or don't do",
      "missing": "what is absent from the market",
      "opportunity": "why this gap is worth pursuing now"
    }
  ],
  "ideas": [
    {
      "title": "Product Name — Short tagline",
      "pitch": "2-3 sentence pitch describing what it does and why it matters.",
      "audience": "Specific target user.",
      "problem": "The exact pain point solved.",
      "gap": "Which gap from the gaps array this addresses.",
      "differentiation": "Why this beats existing options.",
      "closestCompetitors": ["Name1", "Name2", "Name3"],
      "mvpFeatures": ["feature 1", "feature 2", "feature 3"],
      "difficulty": "Easy | Medium | Hard",
      "marketDemand": "Low | Medium | High",
      "competitionLevel": "Low | Medium | High",
      "monetizationPotential": "Low | Medium | High",
      "confidence": <integer 40-95>
    }
  ]
}`;

export function buildAnalysisMessages(
  prompt: string,
  competitors: Competitor[],
  productType: string,
  difficulty: string
): { role: "system" | "user"; content: string }[] {
  const competitorBlock =
    competitors.length > 0
      ? competitors
          .map(
            (c, i) =>
              `${i + 1}. ${c.name} [${c.source}]\n   ${c.snippet}\n   ${c.url}`
          )
          .join("\n\n")
      : "No competitors found via search. Use your training knowledge to map the competitive landscape of software products in this space.";

  const filterLines: string[] = [];
  if (productType) filterLines.push(`Preferred product type: ${productType}`);
  if (difficulty) filterLines.push(`Preferred difficulty: ${difficulty}`);
  const filterBlock = filterLines.length
    ? `\nUser constraints:\n${filterLines.join("\n")}`
    : "";

  return [
    {
      role: "system",
      content: `You are a startup opportunity analyst specializing in DIGITAL SOFTWARE products.

CRITICAL RULE: Only generate ideas for digital products — SaaS, AI tools, apps, developer tools, platforms, browser extensions, or software services. NEVER suggest physical products, ecommerce stores, gear, equipment, merchandise, or hardware businesses.

If the user's prompt touches a physical or offline market (e.g. sports, fitness, food, fashion), redirect the opportunity toward the SOFTWARE layer of that market: the apps, platforms, AI assistants, analytics tools, or workflow tools that serve it.

Every insight must be grounded in the competitor data provided. Scan for:
- Underserved audiences (solo builders, small teams, specific verticals)
- Tools that are too broad, too expensive, or too complex
- Outdated workflows ripe for an AI-first approach
- Crowded categories with no clear winner for a specific niche
- Missing software tools that serve an offline market digitally

closestCompetitors must be real names pulled from the competitor list.
confidence (40–95) should reflect how strongly the evidence supports the idea.
mainPatterns must be specific observations from the data, not generic filler.

Respond ONLY with valid JSON matching this schema exactly. No markdown, no extra keys.

${RESPONSE_SCHEMA}`,
    },
    {
      role: "user",
      content: `User's goal: ${prompt}${filterBlock}

Competitor landscape (${competitors.length} digital products found):
${competitorBlock}

Analyze this market and generate 3 grounded digital product ideas.`,
    },
  ];
}

import type { Competitor } from "@/types";

// ─── Query Generation ─────────────────────────────────────────────────────────

export function buildQueryGenerationMessages(
  prompt: string,
  productType: string
): { role: "system" | "user"; content: string }[] {
  const typeHint = productType ? ` The user prefers a ${productType}.` : "";

  return [
    {
      role: "system",
      content: `You generate short, focused web search queries for competitor discovery.
Output ONLY a JSON object: { "queries": ["query1", "query2", "query3"] }
Rules:
- 2 to 3 queries maximum
- Each query must be 3–6 words
- Target real product categories, not the user's description
- Think: what would someone Google to find tools in this market?
- Do not use the word "competitors" — search like a user would`,
    },
    {
      role: "user",
      content: `User's goal: ${prompt}${typeHint}\n\nGenerate search queries to find existing products in this market.`,
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
      : "No competitors found via search. Use your training knowledge to map the competitive landscape.";

  const filterLines: string[] = [];
  if (productType) filterLines.push(`Preferred product type: ${productType}`);
  if (difficulty) filterLines.push(`Preferred difficulty: ${difficulty}`);
  const filterBlock = filterLines.length
    ? `\nUser constraints:\n${filterLines.join("\n")}`
    : "";

  return [
    {
      role: "system",
      content: `You are a startup opportunity analyst. Study the competitive landscape, identify market gaps, and generate grounded startup ideas that exploit those gaps.

Every insight must be grounded in the competitor data provided — not invented from thin air. Scan for:
- Underserved audiences (solo devs, small teams, specific verticals)
- Tools that are too broad, too expensive, or too complex
- Outdated workflows ripe for an AI-first approach
- Crowded categories with no clear winner
- Missing niche-specific versions of general tools

closestCompetitors for each idea must be real names pulled from the competitor list provided.
confidence (40–95) should reflect how strongly the competitor evidence supports the idea.
mainPatterns must be specific observations from the data, not generic statements.

Respond ONLY with valid JSON matching this schema exactly. No markdown, no extra keys.

${RESPONSE_SCHEMA}`,
    },
    {
      role: "user",
      content: `User's goal: ${prompt}${filterBlock}

Competitor landscape (${competitors.length} found):
${competitorBlock}

Analyze this market and generate 3 grounded startup ideas.`,
    },
  ];
}

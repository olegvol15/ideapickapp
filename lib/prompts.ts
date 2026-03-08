import type { Competitor } from "@/types";

// ─── Query Generation ─────────────────────────────────────────────────────────

const PRODUCT_TYPE_TERMS: Record<string, string[]> = {
  "SaaS":             ["SaaS", "web app"],
  "AI Tool":          ["AI tool", "AI app"],
  "Mobile App":       ["mobile app", "iOS app", "Android app"],
  "Chrome Extension": ["Chrome extension", "browser extension"],
  "Dev Tool":         ["developer tool", "CLI tool"],
};

const DEFAULT_DIGITAL_TERMS = ["software", "SaaS", "app"];

export function buildQueryGenerationMessages(
  prompt: string,
  productType: string
): { role: "system" | "user"; content: string }[] {
  const terms = PRODUCT_TYPE_TERMS[productType] ?? DEFAULT_DIGITAL_TERMS;

  return [
    {
      role: "system",
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
      role: "user",
      content: `User's goal: ${prompt}
Each query MUST include one of: ${terms.map((t) => `"${t}"`).join(", ")}.
Generate 2–3 queries to find real digital products in this market.`,
    },
  ];
}

// ─── Market Analysis + Idea Generation ───────────────────────────────────────

const RESPONSE_SCHEMA = `{
  "marketContext": {
    "theme": "3–6 word phrase naming the niche",
    "competitorsFound": <exact count of competitors provided>,
    "marketCondition": "one phrase e.g. 'crowded but fragmented'",
    "mainPatterns": ["specific observation 1", "specific observation 2", "specific observation 3"],
    "opportunityScore": <integer 1–100>,
    "marketSize": "<dollar estimate e.g. '$1.2B' or 'Emerging' or 'Under $500M'>",
    "growthRate": "<e.g. '22% YoY' or 'Fast growing' or 'Stagnant'>",
    "signals": ["short trend signal 1", "short trend signal 2", "short trend signal 3"]
  },
  "competitorAnalysis": [
    {
      "name": "<product name from competitor list>",
      "domain": "<domain extracted from URL>",
      "url": "<exact URL from competitor list>",
      "strengths": ["specific strength 1", "specific strength 2"],
      "weaknesses": ["specific weakness 1", "specific weakness 2"]
    }
  ],
  "gaps": [
    {
      "title": "Short gap name 3–5 words",
      "currentMarket": "what existing tools do",
      "missing": "what is absent",
      "opportunity": "why pursue this now"
    }
  ],
  "ideas": [
    {
      "title": "Product Name — Short tagline",
      "pitch": "2–3 sentence pitch.",
      "audience": "Specific target user.",
      "problem": "Exact pain point solved.",
      "gap": "Gap this addresses.",
      "differentiation": "Why this beats alternatives.",
      "closestCompetitors": ["Name1", "Name2"],
      "mvpFeatures": ["feature 1", "feature 2", "feature 3"],
      "mvpRoadmap": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ..."],
      "techStack": [
        { "layer": "Frontend", "tech": "React + Vite" },
        { "layer": "Backend", "tech": "FastAPI" },
        { "layer": "AI", "tech": "OpenAI API" }
      ],
      "firstUsers": ["community or channel 1", "community or channel 2", "community or channel 3"],
      "difficulty": "Easy | Medium | Hard",
      "marketDemand": "Low | Medium | High",
      "competitionLevel": "Low | Medium | High",
      "monetizationPotential": "Low | Medium | High",
      "confidence": <integer 40–95>
    }
  ]
}`;

// ─── Ecosystem context per product type ──────────────────────────────────────

const ECOSYSTEM_CONTEXT: Partial<Record<string, string>> = {
  "Mobile App": `Ecosystem: Mobile App market (iOS + Android).
Analyze with awareness of:
- Platform dominance — which platform leads in this niche, and whether cross-platform coverage is a gap
- Rating/review volume as proxy for market satisfaction — low ratings or sparse reviews signal opportunity
- Category saturation — many 4.5★+ apps with 10k+ reviews = hard to displace without a clear niche angle
- App store dynamics: discoverability pressure, in-app purchase norms, onboarding drop-off patterns
For marketContext.signals: include platform distribution, rating benchmarks, review volume patterns.
For competitorAnalysis.weaknesses: note outdated UI, missing platform, poor onboarding, rating gaps.`,

  "SaaS": `Ecosystem: SaaS / Web application market.
Analyze with awareness of:
- Pricing model patterns — freemium trap (hard to convert), per-seat complexity, flat-rate simplicity
- Target team size — solo founder tools vs SMB vs enterprise; niche gaps exist between these tiers
- Feature complexity — bloated SaaS creates space for focused, opinionated alternatives
- Integration ecosystem — API-first vs closed systems; Zapier/Make compatibility as differentiator
For marketContext.signals: include pricing patterns, complexity level, integration gaps.
For competitorAnalysis.weaknesses: note pricing mismatches, complexity bloat, narrow integrations.`,
};

// ─── Enriched competitor block formatting ────────────────────────────────────

function formatCompetitorBlock(competitors: Competitor[]): string {
  if (!competitors.length) {
    return "No competitors found. Use training knowledge for the competitive landscape.";
  }

  return competitors.map((c, i) => {
    const lines: string[] = [`${i + 1}. ${c.name} [${c.source}]`];

    // Mobile enrichment
    if (c.platform && c.platform !== "Web") {
      const meta: string[] = [c.platform];
      if (c.rating != null)     meta.push(`★ ${c.rating}`);
      if (c.reviewCount != null) meta.push(`${c.reviewCount.toLocaleString()} ratings`);
      if (c.category)            meta.push(c.category);
      lines.push(`   ${meta.join(" · ")}`);
    }

    // SaaS pricing signal
    if (c.pricingSignal) {
      lines.push(`   Pricing: ${c.pricingSignal}`);
    }

    lines.push(`   ${c.snippet}`);
    lines.push(`   ${c.url}`);
    return lines.join("\n");
  }).join("\n\n");
}

// ─── Analysis messages ────────────────────────────────────────────────────────

export function buildAnalysisMessages(
  prompt: string,
  competitors: Competitor[],
  productType: string,
  difficulty: string
): { role: "system" | "user"; content: string }[] {
  const competitorBlock = formatCompetitorBlock(competitors);

  const filterLines: string[] = [];
  if (productType) filterLines.push(`Product type: ${productType}`);
  if (difficulty) filterLines.push(`Difficulty: ${difficulty}`);
  const filterBlock = filterLines.length ? `\nConstraints: ${filterLines.join(", ")}` : "";

  const ecosystemBlock = ECOSYSTEM_CONTEXT[productType]
    ? `\n${ECOSYSTEM_CONTEXT[productType]}\n`
    : "";

  return [
    {
      role: "system",
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
      role: "user",
      content: `Goal: ${prompt}${filterBlock}

Competitors found (${competitors.length}):
${competitorBlock}

Analyze and generate 3 grounded digital product ideas.`,
    },
  ];
}

// ─── Idea Refinement ─────────────────────────────────────────────────────────

export function buildRefineMessages(
  idea: import("@/types").Idea,
  instruction: string
): { role: "system" | "user"; content: string }[] {
  return [
    {
      role: "system",
      content: `You are a startup idea refinement assistant. You receive a digital product idea and a refinement instruction.
Return the refined idea as valid JSON using the EXACT same shape as the input — all fields must be present.
Only change fields relevant to the instruction. Keep unchanged fields identical.
Respond ONLY with valid JSON. No markdown, no explanation.`,
    },
    {
      role: "user",
      content: `Refinement instruction: "${instruction}"

Current idea:
${JSON.stringify(idea, null, 2)}

Return the refined idea JSON.`,
    },
  ];
}

// ─── Idea Validation ─────────────────────────────────────────────────────────

export function buildValidateMessages(
  idea: import("@/types").Idea
): { role: "system" | "user"; content: string }[] {
  return [
    {
      role: "system",
      content: `You are a startup idea validator. Analyze a digital product idea and return a validation report as valid JSON:
{
  "score": <integer 1–100>,
  "signals": ["positive signal 1", "positive signal 2", "positive signal 3"],
  "risks": ["risk or red flag 1", "risk or red flag 2"],
  "verdict": "1–2 sentence honest assessment of viability."
}
Be honest, specific, and grounded. Score reflects overall viability.
Respond ONLY with valid JSON. No markdown.`,
    },
    {
      role: "user",
      content: `Validate this idea:
Title: ${idea.title}
Pitch: ${idea.pitch}
Audience: ${idea.audience}
Problem: ${idea.problem}
Differentiation: ${idea.differentiation}
Demand: ${idea.marketDemand} | Competition: ${idea.competitionLevel} | Difficulty: ${idea.difficulty}`,
    },
  ];
}

import type { ProductType } from '@/types';

/** Search terms appended to queries per product type. */
export const PRODUCT_TYPE_TERMS: Partial<Record<ProductType, string[]>> &
  Record<string, string[]> = {
  SaaS: ['SaaS', 'web app'],
  'AI Tool': ['AI tool', 'AI app'],
  'Mobile App': ['mobile app', 'iOS app', 'Android app'],
  'Chrome Extension': ['Chrome extension', 'browser extension'],
  'Dev Tool': ['developer tool', 'CLI tool'],
};

export const DEFAULT_DIGITAL_TERMS = ['software', 'SaaS', 'app'];

/** Ecosystem-aware context injected into the analysis prompt per product type. */
export const ECOSYSTEM_CONTEXT: Partial<Record<string, string>> = {
  'Mobile App': `Ecosystem: Mobile App market (iOS + Android).
Analyze with awareness of:
- Platform dominance — which platform leads in this niche, and whether cross-platform coverage is a gap
- Rating/review volume as proxy for market satisfaction — low ratings or sparse reviews signal opportunity
- Category saturation — many 4.5★+ apps with 10k+ reviews = hard to displace without a clear niche angle
- App store dynamics: discoverability pressure, in-app purchase norms, onboarding drop-off patterns
For marketContext.signals: include platform distribution, rating benchmarks, review volume patterns.
For competitorAnalysis.weaknesses: note outdated UI, missing platform, poor onboarding, rating gaps.`,

  SaaS: `Ecosystem: SaaS / Web application market.
Analyze with awareness of:
- Pricing model patterns — freemium trap (hard to convert), per-seat complexity, flat-rate simplicity
- Target team size — solo founder tools vs SMB vs enterprise; niche gaps exist between these tiers
- Feature complexity — bloated SaaS creates space for focused, opinionated alternatives
- Integration ecosystem — API-first vs closed systems; Zapier/Make compatibility as differentiator
For marketContext.signals: include pricing patterns, complexity level, integration gaps.
For competitorAnalysis.weaknesses: note pricing mismatches, complexity bloat, narrow integrations.`,
};

/** JSON schema string injected verbatim into the analysis system prompt. */
export const RESPONSE_SCHEMA = `{
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
      "title": "Product Name - Short tagline",
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

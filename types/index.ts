export type DifficultyLevel = "Easy" | "Medium" | "Hard";
export type ProductType = "SaaS" | "AI Tool" | "Mobile App" | "Chrome Extension" | "Dev Tool";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type SignalLevel = "Low" | "Medium" | "High";

export interface Competitor {
  name: string;
  url: string;
  snippet: string;
  source: string;
  // Source-specific enrichment
  platform?: "iOS" | "Android" | "Web";
  rating?: number;
  reviewCount?: number;
  category?: string;
  pricingSignal?: string;
}

export interface CompetitorAnalysis {
  name: string;
  domain: string;
  url: string;
  strengths: string[];
  weaknesses: string[];
}

export interface MarketContext {
  theme: string;
  competitorsFound: number;
  marketCondition: string;
  mainPatterns: string[];
  opportunityScore: number;   // 1–100
  marketSize: string;         // e.g. "$1.2B" or "Emerging"
  growthRate: string;         // e.g. "18% YoY" or "Fast"
  signals: string[];          // 3–4 short trend bullets
}

export interface Gap {
  title: string;
  currentMarket: string;
  missing: string;
  opportunity: string;
}

export interface StackItem {
  layer: string;  // e.g. "Frontend", "Backend", "AI"
  tech: string;   // e.g. "React + Vite", "FastAPI", "OpenAI API"
}

export interface ValidationResult {
  score: number;      // 1–100
  signals: string[];  // positive signals
  risks: string[];    // risks / red flags
  verdict: string;    // 1–2 sentence verdict
}

export interface Idea {
  title: string;
  pitch: string;
  audience: string;
  problem: string;
  gap: string;
  differentiation: string;
  closestCompetitors: string[];
  mvpFeatures: string[];
  mvpRoadmap: string[];   // numbered steps to build MVP
  techStack: StackItem[]; // recommended tech per layer
  firstUsers: string[];   // where/how to find first users
  difficulty: DifficultyLevel;
  marketDemand: SignalLevel;
  competitionLevel: SignalLevel;
  monetizationPotential: SignalLevel;
  confidence: number;
}

export interface GenerateRequest {
  prompt: string;
  productType?: string;
  difficulty?: string;
}

export interface GenerateResponse {
  marketContext: MarketContext;
  competitors: Competitor[];
  competitorAnalysis: CompetitorAnalysis[];
  gaps: Gap[];
  ideas: Idea[];
}

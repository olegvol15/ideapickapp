export type DifficultyLevel = "Easy" | "Medium" | "Hard";
export type ProductType = "SaaS" | "AI Tool" | "Chrome Extension" | "Dev Tool";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type SignalLevel = "Low" | "Medium" | "High";

export interface Competitor {
  name: string;
  url: string;
  snippet: string;
  source: string;
}

export interface MarketContext {
  theme: string;
  competitorsFound: number;
  marketCondition: string;
  mainPatterns: string[];
}

export interface Gap {
  title: string;
  currentMarket: string;
  missing: string;
  opportunity: string;
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
  gaps: Gap[];
  ideas: Idea[];
}

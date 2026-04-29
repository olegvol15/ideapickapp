import type { Idea } from './idea.types';
import type {
  Competitor,
  CompetitorAnalysis,
  MarketContext,
  Gap,
} from './market.types';

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

export interface ValidationResult {
  score: number;
  signals: string[];
  risks: string[];
  verdict: string;
}

export interface ExploreIdea {
  title: string;
  description: string;
  score: number;
  verdict: string;
  bullets: string[];
  nextStep: string;
}

export interface ExploreIdeasRequest {
  interest: string;
  constraints: string[];
  previousIdeas?: string[];
}

export interface ExploreIdeasResponse {
  ideas: ExploreIdea[];
}

export interface QuickValidateRequest {
  description: string;
  audience: string;
  problem: string;
}

export interface QuickValidateResponse {
  verdict: string;
  score: number;
  bullets: string[];
  nextStep: string;
}

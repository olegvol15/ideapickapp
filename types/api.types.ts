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

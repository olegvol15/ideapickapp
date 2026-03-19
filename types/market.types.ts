export interface Competitor {
  name: string;
  url: string;
  snippet: string;
  source: string;
  type?: 'competitor' | 'signal';
  platform?: 'iOS' | 'Android' | 'Web';
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
  opportunityScore: number;
  marketSize: string;
  growthRate: string;
  signals: string[];
}

export interface Gap {
  title: string;
  currentMarket: string;
  missing: string;
  opportunity: string;
}

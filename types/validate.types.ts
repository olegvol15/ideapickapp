export interface ValidateRequest {
  description: string;
  productType: string;
  audience?: string;
  problem?: string;
}

export interface EvidenceSource {
  name: string;
  url: string;
  source: string;
  kind: 'web' | 'appstore';
}

export type {
  PainEvidenceResult,
  PainTheme,
  PainQuote,
} from '@/lib/schemas';

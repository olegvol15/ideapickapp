export interface ValidateRequest {
  description: string;
  productType: string;
  audience?: string;
  problem?: string;
  monetization?: string;
}

export interface IdeaContext {
  description: string;
  audience?: string;
  problem?: string;
  monetization?: string;
}

export type { EnhancedValidationResult } from '@/lib/schemas';

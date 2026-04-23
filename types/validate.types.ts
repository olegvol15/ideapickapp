export interface ValidateRequest {
  description: string;
  productType: string;
  audience?: string;
  problem?: string;
}

export interface IdeaContext {
  description: string;
  audience?: string;
  problem?: string;
}

export type { EnhancedValidationResult } from '@/lib/schemas';

export interface ValidateRequest {
  description: string;
  productType: string;
  audience?: string;
  problem?: string;
}

export type { EnhancedValidationResult } from '@/lib/schemas';

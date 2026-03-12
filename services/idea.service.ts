import { typedApi } from '@/lib/api/client';
import type { Idea, ValidationResult } from '@/types';

// Error toasts and response unwrapping are handled by the Axios interceptor
// in @/lib/api/client — no try/catch or .json() needed here.

export async function validateIdea(idea: Idea): Promise<ValidationResult> {
  return typedApi.post<ValidationResult>('/api/validate', { idea });
}

export async function refineIdea(
  idea: Idea,
  instruction: string
): Promise<Idea> {
  return typedApi.post<Idea>('/api/refine', { idea, instruction });
}

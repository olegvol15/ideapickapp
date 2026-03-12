import { typedApi } from '@/lib/api/client';
import type { GenerateRequest, GenerateResponse } from '@/types';

// Error toasts and response unwrapping are handled by the Axios interceptor
// in @/lib/api/client — no try/catch or .json() needed here.
export async function generateIdeas(
  request: GenerateRequest
): Promise<GenerateResponse> {
  return typedApi.post<GenerateResponse>('/api/generate', request);
}

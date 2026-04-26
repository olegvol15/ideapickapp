import { fetchNdjsonStream } from '@/lib/ndjson-stream';
import type { ValidateRequest } from '@/types/validate.types';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

type StreamEvent =
  | { type: 'research'; data: { competitors: Competitor[] } }
  | { type: 'done'; data: { result: EnhancedValidationResult; competitors: Competitor[] } };

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function validateIdeaStream(
  request: ValidateRequest,
  options: {
    onResearch?: (competitors: Competitor[]) => void;
    signal?: AbortSignal;
  } = {}
): Promise<{ result: EnhancedValidationResult; competitors: Competitor[] }> {
  return fetchNdjsonStream(
    `${apiBase}/api/validate`,
    request,
    (raw) => {
      const event = raw as StreamEvent;
      if (event.type === 'research') options.onResearch?.(event.data.competitors);
      if (event.type === 'done') return event.data;
    },
    options.signal,
  );
}

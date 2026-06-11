import { fetchNdjsonStream } from '@/lib/ndjson-stream';
import type {
  EvidenceSource,
  ValidateRequest,
} from '@/types/validate.types';
import type { PainEvidenceResult } from '@/lib/schemas';

type StreamEvent =
  | { type: 'sources'; data: { sources: EvidenceSource[] } }
  | {
      type: 'done';
      data: { result: PainEvidenceResult; sources: EvidenceSource[] };
    };

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function validateIdeaStream(
  request: ValidateRequest,
  options: {
    onSources?: (sources: EvidenceSource[]) => void;
    signal?: AbortSignal;
  } = {}
): Promise<{ result: PainEvidenceResult; sources: EvidenceSource[] }> {
  return fetchNdjsonStream(
    `${apiBase}/api/validate`,
    request,
    (raw) => {
      const event = raw as StreamEvent;
      if (event.type === 'sources') options.onSources?.(event.data.sources);
      if (event.type === 'done') return event.data;
    },
    options.signal
  );
}

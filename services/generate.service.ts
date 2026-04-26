import { fetchNdjsonStream } from '@/lib/ndjson-stream';
import type { GenerateRequest, GenerateResponse, Competitor } from '@/types';

type StreamEvent =
  | { type: 'competitors'; data: Competitor[] }
  | { type: 'done'; data: GenerateResponse };

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function generateIdeasStream(
  request: GenerateRequest,
  options: {
    onCompetitors?: (competitors: Competitor[]) => void;
    signal?: AbortSignal;
  } = {}
): Promise<GenerateResponse> {
  return fetchNdjsonStream(
    `${apiBase}/api/generate`,
    request,
    (raw) => {
      const event = raw as StreamEvent;
      if (event.type === 'competitors') options.onCompetitors?.(event.data);
      if (event.type === 'done') return event.data;
    },
    options.signal,
  );
}

import type { GenerateRequest, GenerateResponse, Competitor } from '@/types';

type StreamEvent =
  | { type: 'competitors'; data: Competitor[] }
  | { type: 'done'; data: GenerateResponse }
  | { type: 'error'; message: string; status: number };

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function generateIdeasStream(
  request: GenerateRequest,
  options: {
    onCompetitors?: (competitors: Competitor[]) => void;
    signal?: AbortSignal;
  } = {}
): Promise<GenerateResponse> {
  const res = await fetch(`${apiBase}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request),
    signal: options.signal,
  });

  if (!res.ok) {
    let message = 'Something went wrong';
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch { /* ignore */ }
    throw Object.assign(new Error(message), { status: res.status });
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // last item may be an incomplete line

    for (const line of lines) {
      if (!line.trim()) continue;
      let event: StreamEvent;
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }

      if (event.type === 'competitors') {
        options.onCompetitors?.(event.data);
      } else if (event.type === 'done') {
        return event.data;
      } else if (event.type === 'error') {
        throw Object.assign(new Error(event.message), { status: event.status });
      }
    }
  }

  throw new Error('Stream ended without a result');
}

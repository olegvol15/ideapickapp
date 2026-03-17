import type { ValidateRequest } from '@/types/validate.types';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

type StreamEvent =
  | { type: 'research'; data: { competitors: Competitor[] } }
  | { type: 'done'; data: { result: EnhancedValidationResult; competitors: Competitor[] } }
  | { type: 'error'; message: string; status: number };

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function validateIdeaStream(
  request: ValidateRequest,
  options: {
    onResearch?: (competitors: Competitor[]) => void;
    signal?: AbortSignal;
  } = {}
): Promise<{ result: EnhancedValidationResult; competitors: Competitor[] }> {
  const res = await fetch(`${apiBase}/api/validate`, {
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
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      let event: StreamEvent;
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }

      if (event.type === 'research') {
        options.onResearch?.(event.data.competitors);
      } else if (event.type === 'done') {
        return event.data;
      } else if (event.type === 'error') {
        throw Object.assign(new Error(event.message), { status: event.status });
      }
    }
  }

  throw new Error('Stream ended without a result');
}

type RawEvent = { type: string } & Record<string, unknown>;

export async function fetchNdjsonStream<TDone>(
  url: string,
  body: unknown,
  onEvent: (event: RawEvent) => TDone | undefined,
  signal?: AbortSignal,
): Promise<TDone> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let message = 'Something went wrong';
    try {
      const b = await res.json();
      if (b?.message) message = b.message;
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
      let event: RawEvent;
      try { event = JSON.parse(line); } catch { continue; }

      if (event.type === 'error') {
        throw Object.assign(
          new Error(String(event['message'] ?? 'Stream error')),
          { status: Number(event['status'] ?? 500) },
        );
      }

      const result = onEvent(event);
      if (result !== undefined) return result;
    }
  }

  throw new Error('Stream ended without a result');
}

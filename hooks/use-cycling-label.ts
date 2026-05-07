'use client';

import { useState, useEffect } from 'react';

export function useCyclingLabel(active: boolean, messages: string[], intervalMs = 2800): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) {
      setIdx(0);
      return;
    }
    const id = setInterval(() => setIdx((i) => (i + 1) % messages.length), intervalMs);
    return () => clearInterval(id);
  }, [active, messages, intervalMs]);
  return messages[idx];
}

'use client';

import { useState, useEffect } from 'react';

const SCORING_LABELS = [
  'Computing competition scores…',
  'Weighing pain signals…',
  'Identifying market opportunities…',
  'Running niche comparison…',
  'Finalising validation report…',
];

export function useCyclingLabel(active: boolean): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) {
      setIdx(0);
      return;
    }
    const id = setInterval(
      () => setIdx((i) => (i + 1) % SCORING_LABELS.length),
      2800
    );
    return () => clearInterval(id);
  }, [active]);
  return SCORING_LABELS[idx];
}

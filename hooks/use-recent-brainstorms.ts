'use client';

import { useState, useEffect } from 'react';
import { loadStorage, pushHistory, type PersistedResearch, HISTORY_KEY, STORAGE_KEY, HISTORY_EVENT } from './use-research';

export type { PersistedResearch };

export function useRecentBrainstorms() {
  const [items, setItems] = useState<PersistedResearch[]>(() =>
    loadStorage<PersistedResearch[]>(HISTORY_KEY) ?? []
  );

  useEffect(() => {
    const refresh = () => setItems(loadStorage<PersistedResearch[]>(HISTORY_KEY) ?? []);
    window.addEventListener(HISTORY_EVENT, refresh);
    return () => window.removeEventListener(HISTORY_EVENT, refresh);
  }, []);

  function restore(entry: PersistedResearch) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entry)); } catch { /* quota */ }
    // Bubble to top of history
    pushHistory(entry);
    // Navigate to playground — full reload so useResearch re-initialises from storage
    window.location.href = '/';
  }

  return { items, restore };
}

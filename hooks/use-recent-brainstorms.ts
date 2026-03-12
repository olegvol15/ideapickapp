'use client';

import { useState, useEffect } from 'react';
import {
  loadStorage,
  type PersistedResearch,
  HISTORY_KEY,
  STORAGE_KEY,
  HISTORY_EVENT,
  RESTORE_EVENT,
} from './use-research';

export type { PersistedResearch };

function getActiveCreatedAt(): number | null {
  return loadStorage<PersistedResearch>(STORAGE_KEY)?.createdAt ?? null;
}

export function useRecentBrainstorms() {
  const [items, setItems] = useState<PersistedResearch[]>([]);
  const [activeCreatedAt, setActiveCreatedAt] = useState<number | null>(null);

  useEffect(() => {
    setItems(loadStorage<PersistedResearch[]>(HISTORY_KEY) ?? []);
    setActiveCreatedAt(getActiveCreatedAt());

    const refreshHistory = () =>
      setItems(loadStorage<PersistedResearch[]>(HISTORY_KEY) ?? []);
    const refreshActive = (e: Event) => {
      setActiveCreatedAt((e as CustomEvent<PersistedResearch>).detail.createdAt);
    };

    window.addEventListener(HISTORY_EVENT, refreshHistory);
    window.addEventListener(RESTORE_EVENT, refreshActive);
    return () => {
      window.removeEventListener(HISTORY_EVENT, refreshHistory);
      window.removeEventListener(RESTORE_EVENT, refreshActive);
    };
  }, []);

  function restore(entry: PersistedResearch) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entry)); } catch { /* quota */ }
    window.dispatchEvent(new CustomEvent(RESTORE_EVENT, { detail: entry }));
  }

  return { items, activeCreatedAt, restore };
}

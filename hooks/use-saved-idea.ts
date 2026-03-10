'use client';

import { useState } from 'react';
import type { Idea } from '@/types';
import { isSaved, toggleSave } from '@/services/storage.service';

export interface UseSavedIdeaReturn {
  saved:  boolean;
  toggle: () => boolean; // returns new saved state
}

export function useSavedIdea(idea: Idea): UseSavedIdeaReturn {
  const [saved, setSaved] = useState(() => isSaved(idea.title));

  function toggle(): boolean {
    const next = toggleSave(idea);
    setSaved(next);
    return next;
  }

  return { saved, toggle };
}

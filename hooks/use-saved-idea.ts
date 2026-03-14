'use client';

import { useState } from 'react';
import type { Idea } from '@/types';
import {
  useGetSavedIdeas,
  useSaveIdea,
  useUnsaveIdea,
} from '@/hooks/use-saved-ideas';

export interface UseSavedIdeaReturn {
  saved: boolean;
  toggle: (generationId?: string | null) => boolean;
  requiresAuth: boolean;
  clearAuthRequired: () => void;
}

export function useSavedIdea(
  idea: Idea | null,
  userId: string | undefined
): UseSavedIdeaReturn {
  const [requiresAuth, setRequiresAuth] = useState(false);

  const { data: savedIdeas = [] } = useGetSavedIdeas(userId);
  const saveIdea = useSaveIdea(userId);
  const unsaveIdea = useUnsaveIdea(userId);

  const saved =
    !!userId && savedIdeas.some((r) => r.idea_json.title === idea?.title);

  function toggle(generationId?: string | null): boolean {
    if (!idea?.title) return false;

    if (!userId) {
      setRequiresAuth(true);
      return saved;
    }

    const next = !saved;
    if (next) {
      saveIdea.mutate({ generationId: generationId ?? null, idea });
    } else {
      unsaveIdea.mutate(idea.title);
    }
    return next;
  }

  return {
    saved,
    toggle,
    requiresAuth,
    clearAuthRequired: () => setRequiresAuth(false),
  };
}

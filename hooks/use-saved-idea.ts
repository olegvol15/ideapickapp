'use client';

import type { Idea } from '@/types';
import {
  useGetSavedIdeas,
  useSaveIdea,
  useUnsaveIdea,
} from '@/hooks/use-saved-ideas';

export interface UseSavedIdeaReturn {
  saved: boolean;
  toggle: (generationId?: string | null) => void;
}

export function useSavedIdea(
  idea: Idea | null,
  userId: string | undefined
): UseSavedIdeaReturn {
  const { data: savedIdeas = [] } = useGetSavedIdeas(userId);
  const saveIdea = useSaveIdea(userId);
  const unsaveIdea = useUnsaveIdea(userId);

  const savedRow =
    userId && idea?.title
      ? (savedIdeas.find((r) => r.idea_json.title === idea.title) ?? null)
      : null;
  const saved = !!savedRow;

  function toggle(generationId?: string | null): void {
    if (!idea?.title || !userId) return;
    if (saved && savedRow) {
      unsaveIdea.mutate(savedRow.id);
    } else {
      saveIdea.mutate({ generationId: generationId ?? null, idea });
    }
  }

  return { saved, toggle };
}

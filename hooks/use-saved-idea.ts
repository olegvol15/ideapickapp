'use client';

import { useEffect, useState } from 'react';
import type { Idea } from '@/types';
import {
  isIdeaSavedInDB,
  saveIdeaToDB,
  unsaveIdeaFromDB,
} from '@/services/db.service';
import { useAuth } from '@/context/auth';

const SAVED_EVENT = 'ideapick:saved-change';

export interface UseSavedIdeaReturn {
  saved: boolean;
  // Returns new saved state; opens auth gate if not logged in
  toggle: (generationId?: string | null) => boolean;
  requiresAuth: boolean; // true after a toggle attempt while unauthenticated
  clearAuthRequired: () => void;
}

interface SavedIdeaEventDetail {
  title: string;
  saved: boolean;
}

function emitSavedChange(title: string, nextSaved: boolean) {
  window.dispatchEvent(
    new CustomEvent<SavedIdeaEventDetail>(SAVED_EVENT, {
      detail: { title, saved: nextSaved },
    })
  );
}

export function useSavedIdea(idea: Idea | null): UseSavedIdeaReturn {
  const { user } = useAuth();
  const [savedState, setSavedState] = useState<{
    title: string | null;
    saved: boolean;
  }>({
    title: idea?.title ?? null,
    saved: false,
  });
  const [requiresAuth, setRequiresAuth] = useState(false);

  const saved =
    user && idea?.title && savedState.title === idea.title
      ? savedState.saved
      : false;

  useEffect(() => {
    if (!idea?.title) return;

    const handler = (event: Event) => {
      const { detail } = event as CustomEvent<SavedIdeaEventDetail>;
      if (detail.title === idea.title) {
        setSavedState({ title: idea.title, saved: detail.saved });
      }
    };

    window.addEventListener(SAVED_EVENT, handler);
    return () => window.removeEventListener(SAVED_EVENT, handler);
  }, [idea?.title]);

  useEffect(() => {
    if (!idea?.title || !user) return;

    let cancelled = false;

    isIdeaSavedInDB(user.id, idea.title).then((nextSaved) => {
      if (!cancelled) {
        setSavedState({ title: idea.title, saved: nextSaved });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [idea?.title, user]);

  function toggle(generationId?: string | null): boolean {
    if (!idea?.title) return false;

    if (!user) {
      // Signal to the parent that auth is required instead of saving.
      setRequiresAuth(true);
      return saved;
    }

    const next = !saved;
    setSavedState({ title: idea.title, saved: next });
    emitSavedChange(idea.title, next);

    if (next) {
      saveIdeaToDB({
        userId: user.id,
        generationId: generationId ?? null,
        idea,
      }).then((id) => {
        if (id) return;
        setSavedState({ title: idea.title, saved: false });
        emitSavedChange(idea.title, false);
      });
    } else {
      unsaveIdeaFromDB(user.id, idea.title).catch(() => {
        setSavedState({ title: idea.title, saved: true });
        emitSavedChange(idea.title, true);
      });
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

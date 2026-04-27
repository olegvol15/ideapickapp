'use client';

import { useEffect, useRef } from 'react';
import { useWorkspace, useUpsertWorkspace } from '@/hooks/use-workspaces';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { Idea } from '@/types';

// Keeps workspace tasks and content synced with the DB.
// On mount: loads from DB and hydrates the store if local state is empty.
// On changes: debounced upsert so every keystroke/action doesn't hit the DB.
export function useWorkspaceSync(
  ideaId: string,
  idea: Idea | null,
  userId: string | undefined
) {
  const { data: remote } = useWorkspace(userId, ideaId);
  const { mutate: upsertWorkspace } = useUpsertWorkspace(userId);
  const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

  // Read raw store values — do NOT use `?? []` here because a new `[]` on every
  // render would change the reference, trigger the effect, and create an infinite loop.
  const rawTasks = useWorkspaceStore((s) => s.todos[ideaId]);
  const rawContent = useWorkspaceStore((s) => s.contentItems[ideaId]);
  const title = useWorkspaceStore(
    (s) => s.workspaceTitles[ideaId] ?? idea?.title ?? ''
  );

  // True after we have either hydrated from DB or created the initial DB row.
  const readyToSaveRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve the first DB load before any autosave.
  useEffect(() => {
    if (!userId || !idea || readyToSaveRef.current) return;
    if (remote === undefined) return;

    if (remote) {
      const localEmpty = !rawTasks?.length && !rawContent?.length;
      if (localEmpty) {
        readyToSaveRef.current = true;
        skipNextSaveRef.current = true;
        hydrateWorkspace(
          ideaId,
          remote.tasks_json,
          remote.content_json,
          remote.idea_json
        );
        return;
      }
      readyToSaveRef.current = true;
      return;
    }

    // No DB row yet — create it and hydrate the store so refs stabilise.
    const tasks = rawTasks ?? [];
    const content = rawContent ?? [];
    readyToSaveRef.current = true;
    skipNextSaveRef.current = true;
    hydrateWorkspace(ideaId, tasks, content, idea);
    upsertWorkspace({ slug: ideaId, title: idea.title, idea, tasks, content });
  }, [
    userId,
    idea,
    remote,
    ideaId,
    rawTasks,
    rawContent,
    hydrateWorkspace,
    upsertWorkspace,
  ]);

  // Debounced save on workspace changes after the initial load is resolved.
  useEffect(() => {
    if (!userId || !idea || !readyToSaveRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const tasks = rawTasks ?? [];
    const content = rawContent ?? [];
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      upsertWorkspace({ slug: ideaId, title, idea, tasks, content });
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [userId, ideaId, title, idea, rawTasks, rawContent, upsertWorkspace]);
}

'use client';

import { useEffect, useRef } from 'react';
import { useWorkspace, useUpsertWorkspace } from '@/hooks/use-workspaces';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { Idea } from '@/types';
import type { WorkspaceSnapshot } from '@/types/workspace.types';

// Keeps workspace tasks and content synced with the DB.
// On mount: loads from DB and hydrates the store if local state is empty.
// On changes: debounced upsert via Zustand subscription so the effect body is cleanup-only.
export function useWorkspaceSync(
  ideaId: string,
  idea: Idea | null,
  userId: string | undefined
) {
  const { data: remote } = useWorkspace(userId, ideaId);
  const { mutate: upsertWorkspace } = useUpsertWorkspace(userId);
  const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

  const readyToSaveRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSnapshotRef = useRef<WorkspaceSnapshot>({
    tasks: undefined,
    content: undefined,
    title: undefined,
  });

  // Resolve the first DB load before any autosave.
  useEffect(() => {
    if (!userId || !idea || readyToSaveRef.current) return;
    if (remote === undefined) return;

    const s = useWorkspaceStore.getState();
    const rawTasks = s.todos[ideaId];
    const rawContent = s.contentItems[ideaId];

    if (remote) {
      const localEmpty = !rawTasks?.length && !rawContent?.length;
      if (localEmpty) {
        readyToSaveRef.current = true;
        skipNextSaveRef.current = true;
        hydrateWorkspace(ideaId, remote.tasks_json, remote.content_json, remote.idea_json);
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
  }, [userId, idea, remote, ideaId, hydrateWorkspace, upsertWorkspace]);

  // Debounced save on workspace changes — effect is cleanup-only (subscribe/unsubscribe).
  useEffect(() => {
    if (!userId || !idea) return;
    const unsubscribe = useWorkspaceStore.subscribe(() => {
      if (!readyToSaveRef.current || skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        return;
      }
      const s = useWorkspaceStore.getState();
      const tasks = s.todos[ideaId];
      const content = s.contentItems[ideaId];
      const title = s.workspaceTitles[ideaId];

      const prev = prevSnapshotRef.current;
      if (tasks === prev.tasks && content === prev.content && title === prev.title) return;
      prevSnapshotRef.current = { tasks, content, title };

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        upsertWorkspace({
          slug: ideaId,
          title: title ?? idea.title,
          idea,
          tasks: tasks ?? [],
          content: content ?? [],
        });
      }, 800);
    });
    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [userId, ideaId, idea, upsertWorkspace]);
}

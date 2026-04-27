'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs';
import { getPlan } from '@/services/storage.service';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorkspace } from '@/hooks/use-workspaces';
import { useWorkspaceSync } from '@/hooks/use-workspace-sync';
import { useAuth } from '@/context/auth';
import type { Idea } from '@/types';

export default function WorkspacePage() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Defer persisted client-only data until after mount to avoid SSR hydration mismatch.
  // Zustand persist reads localStorage synchronously, causing server/client divergence.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const _storeIdea = useWorkspaceStore((s) => s.workspaceIdeas[ideaId] ?? null);
  const setWorkspaceIdea = useWorkspaceStore((s) => s.setWorkspaceIdea);
  const storeIdea = mounted ? _storeIdea : null;

  // DB fallback: if sessionStorage and store are both empty, try DB.
  const { data: remote, isLoading: remoteLoading } = useWorkspace(
    user?.id,
    ideaId
  );
  const sessionIdea = useMemo(
    () => (mounted ? getPlan(ideaId) : null),
    [ideaId, mounted]
  );
  const idea: Idea | null =
    sessionIdea ?? storeIdea ?? remote?.idea_json ?? null;
  const notFound = !idea && !authLoading && !remoteLoading;

  useEffect(() => {
    if (idea) setWorkspaceIdea(ideaId, idea);
  }, [ideaId, idea, setWorkspaceIdea]);

  // DB sync: auto-save tasks and content changes, create record on first open.
  useWorkspaceSync(ideaId, idea, user?.id);

  if (notFound) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm">
          Workspace not found. Start from a brainstorm result.
        </p>
        <Button variant="link" size="sm" onClick={() => router.push('/')}>
          ← Go home
        </Button>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-svh flex-col">
      <WorkspaceTabs
        idea={idea}
        ideaId={ideaId}
        userId={user?.id}
        authLoading={authLoading}
      />
    </div>
  );
}

'use client';

import { useLayoutEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs';
import { getPlan } from '@/services/storage.service';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useAuth } from '@/context/auth';
import type { Idea } from '@/types';

export default function WorkspacePage() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [notFound, setNotFound] = useState(false);

  useLayoutEffect(() => {
    // Try sessionStorage first, fall back to localStorage copy in the workspace store
    const cached = getPlan(ideaId) ?? useWorkspaceStore.getState().workspaceIdeas[ideaId] ?? null;
    if (cached) {
      setIdea(cached);
      useWorkspaceStore.getState().setWorkspaceIdea(ideaId, cached);
    } else {
      setNotFound(true);
    }
  }, [ideaId]);

  if (notFound) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm">Workspace not found. Start from a brainstorm result.</p>
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
      <WorkspaceTabs idea={idea} ideaId={ideaId} userId={user?.id} authLoading={authLoading} />
    </div>
  );
}

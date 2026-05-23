'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckSquare, FileText, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TodoBoard } from '@/components/workspace/todo/TodoBoard';
import { ContentTab } from '@/components/workspace/content/ContentTab';
import { WorkspaceRoadmap } from '@/components/workspace/roadmap/WorkspaceRoadmap';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { Idea } from '@/types';
import type { WorkspaceTab } from '@/types/workspace.types';

const TABS: { value: WorkspaceTab; label: string; Icon: React.ElementType }[] =
  [
    { value: 'todo', label: 'Tasks', Icon: CheckSquare },
    { value: 'content', label: 'Content', Icon: FileText },
    { value: 'roadmap', label: 'Roadmap', Icon: GitBranch },
  ];

interface WorkspaceTabsProps {
  idea: Idea;
  ideaId: string;
  userId: string | undefined;
  authLoading: boolean;
}

export function WorkspaceTabs({
  idea,
  ideaId,
  userId,
  authLoading,
}: WorkspaceTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeTab, setActiveTab, todos, contentItems } = useWorkspaceStore();

  useEffect(() => {
    const param = searchParams.get('tab') as WorkspaceTab | null;
    if (param && ['todo', 'content', 'roadmap'].includes(param))
      setActiveTab(param);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchTab(tab: WorkspaceTab) {
    setActiveTab(tab);
    router.replace(`?tab=${tab}`, { scroll: false });
  }

  // Task summary for header badge
  const tasks = todos[ideaId] ?? [];
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const contentCount = (contentItems[ideaId] ?? []).length;

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex shrink-0 items-stretch border-b border-border/50 bg-card/80 backdrop-blur-md">
        {/* Back to all workspaces */}
        <Link
          href="/workspaces"
          className="flex shrink-0 items-center gap-2 border-r border-border/40 px-4 py-3 text-xs font-semibold text-muted-foreground/70 transition-colors hover:bg-muted/30 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          All workspaces
        </Link>

        {/* Idea identity */}
        <div className="flex min-w-0 flex-col justify-center border-r border-border/40 px-5 py-3 pr-6">
          <span className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/40">
            Workspace
          </span>
          <h1 className="max-w-[240px] truncate text-sm font-semibold leading-tight text-foreground">
            {idea.title}
          </h1>
        </div>

        {/* Tab nav */}
        <nav className="flex items-stretch gap-0">
          {TABS.map(({ value, label, Icon }) => {
            const active = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => switchTab(value)}
                className={cn(
                  'relative flex items-center gap-2 border-r border-border/30 px-4 py-3 text-xs font-semibold transition-colors duration-150',
                  active
                    ? 'bg-background/60 text-foreground'
                    : 'text-muted-foreground/50 hover:bg-muted/30 hover:text-foreground/80'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}

                {/* Count badge */}
                {value === 'todo' && tasks.length > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-px text-[9px] font-bold tabular-nums',
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted-foreground/10 text-muted-foreground/50'
                    )}
                  >
                    {tasks.length}
                  </span>
                )}
                {value === 'content' && contentCount > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-px text-[9px] font-bold tabular-nums',
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted-foreground/10 text-muted-foreground/50'
                    )}
                  >
                    {contentCount}
                  </span>
                )}

                {/* Active underline */}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-t-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Progress pill — far right */}
        {tasks.length > 0 && (
          <div className="ml-auto flex items-center gap-3 px-5">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.round((doneCount / tasks.length) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground/50">
                {doneCount}/{tasks.length}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1">
        {activeTab === 'todo' && (
          <div className="flex h-full flex-col p-5 pt-4">
            <TodoBoard ideaId={ideaId} />
          </div>
        )}

        {activeTab === 'content' && (
          <div className="flex h-full flex-col p-5 pt-4">
            <ContentTab idea={idea} ideaId={ideaId} />
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="h-full">
            <WorkspaceRoadmap
              idea={idea}
              ideaId={ideaId}
              userId={userId}
              authLoading={authLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}

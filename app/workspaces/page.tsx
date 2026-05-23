'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, Loader2, Search, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/auth';
import {
  useWorkspaces,
  useDeleteWorkspace,
  useRenameWorkspace,
} from '@/hooks/use-workspaces';
import { useWorkspaceStore } from '@/stores/workspace.store';

type SortKey = 'activity' | 'title';

interface WorkspaceItem {
  id: string;
  title: string;
  description: string;
  updatedAt?: string;
}

export default function WorkspacesPage() {
  const { user, loading } = useAuth();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('activity');

  const { data: dbWorkspaces, isLoading: dbLoading } = useWorkspaces(user?.id);
  const guestTitles = useWorkspaceStore((s) => s.workspaceTitles);
  const setWorkspaceTitle = useWorkspaceStore((s) => s.setWorkspaceTitle);
  const deleteMutation = useDeleteWorkspace(user?.id);
  const renameMutation = useRenameWorkspace(user?.id);

  const workspaces: WorkspaceItem[] = user
    ? (dbWorkspaces ?? []).map((w) => ({
        id: w.idea_slug,
        title: w.title,
        description: w.idea_json?.pitch || w.idea_json?.problem || '',
        updatedAt: w.updated_at,
      }))
    : Object.entries(guestTitles).map(([id, title]) => ({
        id,
        title,
        description: '',
      }));

  const isLoading = loading || (Boolean(user) && dbLoading);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? workspaces.filter(
          (w) =>
            w.title.toLowerCase().includes(q) ||
            w.description.toLowerCase().includes(q)
        )
      : workspaces;
    const sorted = [...matched];
    if (sort === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      sorted.sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tb - ta;
      });
    }
    return sorted;
  }, [workspaces, query, sort]);

  function handleDelete(id: string) {
    if (user) deleteMutation.mutate(id);
  }

  function handleRename(id: string, title: string) {
    setWorkspaceTitle(id, title);
    if (user) renameMutation.mutate({ slug: id, title });
  }

  return (
    <AppShell>
      <main className="relative mx-auto flex max-w-5xl flex-col gap-10 px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground/70">
            Workspace
          </p>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Workspaces
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All ideas you&rsquo;ve moved into a workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground/70">
              Sort by
            </span>
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as SortKey)}
            >
              <SelectTrigger className="h-9 w-[140px] py-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search workspaces…"
              className="h-8 pl-8 pr-8 text-sm"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/40 hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card/60">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your workspaces...
            </div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-primary/[0.06] text-primary">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                No workspaces yet
              </p>
              <p className="text-sm text-muted-foreground">
                Validate an idea and save it to create a workspace.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/validate">Validate an idea</Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No workspaces match &ldquo;{query}&rdquo;
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((w, index) => (
                <motion.div
                  key={w.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <WorkspaceCard
                    id={w.id}
                    title={w.title}
                    description={w.description}
                    updatedAt={w.updatedAt}
                    onDelete={user ? () => handleDelete(w.id) : undefined}
                    onRename={(title) => handleRename(w.id, title)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Loader2,
  Sparkles,
  FileText,
  Zap,
  Search,
  Users,
  Rocket,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { typedApi } from '@/lib/api/client';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { ContentCard } from './ContentCard';
import type { Idea } from '@/types';
import type { ContentGoal, ContentType } from '@/types/workspace.types';

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const GOALS: {
  value: ContentGoal;
  label: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    value: 'validate',
    label: 'Validate',
    description: 'Is this problem real?',
    Icon: Search,
  },
  {
    value: 'community',
    label: 'Community',
    description: 'Find early adopters',
    Icon: Users,
  },
  {
    value: 'features',
    label: 'Features',
    description: 'What do people want?',
    Icon: Sparkles,
  },
  {
    value: 'launch',
    label: 'Launch',
    description: 'Drive sign-ups',
    Icon: Rocket,
  },
];

interface ContentTabProps {
  idea: Idea;
  ideaId: string;
}

export function ContentTab({ idea, ideaId }: ContentTabProps) {
  const {
    contentItems,
    pendingContent,
    addContentItem,
    deleteContentItem,
    setPendingContent,
  } = useWorkspaceStore();

  const items = contentItems[ideaId] ?? [];

  const [type, setType] = useState<ContentType>('tweet');
  const [goal, setGoal] = useState<ContentGoal>('validate');
  const [stepContext, setStepContext] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-add content arriving from roadmap action buttons
  useEffect(() => {
    if (!pendingContent) return;
    addContentItem(ideaId, pendingContent);
    setPendingContent(null);
  }, [pendingContent, ideaId, addContentItem, setPendingContent]);

  async function generate() {
    setLoading(true);
    try {
      const { content } = await typedApi.post<{ content: string }>(
        '/api/content',
        {
          type,
          goal,
          idea: {
            title: idea.title,
            pitch: idea.pitch,
            audience: idea.audience,
            problem: idea.problem,
          },
          ...(stepContext.trim() ? { stepContext: stepContext.trim() } : {}),
        }
      );
      addContentItem(ideaId, {
        type,
        text: content,
        context: stepContext.trim() || undefined,
      });
      setStepContext('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 gap-5">
      {/* ── Left sidebar: generate form ── */}
      <aside className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto">
        {/* Format toggle */}
        <section className="rounded-2xl border border-border/50 bg-card p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">
            Format
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                value: 'tweet' as ContentType,
                icon: <XIcon className="h-4 w-4" />,
                label: 'X',
                active: 'border-sky-400/40 bg-sky-400/10 text-sky-400',
              },
              {
                value: 'reddit' as ContentType,
                icon: <MessageSquare className="h-4 w-4" />,
                label: 'Reddit',
                active: 'border-orange-400/40 bg-orange-400/10 text-orange-400',
              },
            ].map(({ value, icon, label, active }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-all duration-150',
                  type === value
                    ? active
                    : 'border-border/40 text-muted-foreground/50 hover:border-border hover:text-foreground/80'
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Goal picker */}
        <section className="rounded-2xl border border-border/50 bg-card p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">
            Goal
          </p>
          <div className="flex flex-col gap-1">
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150',
                  goal === g.value
                    ? 'border-primary/30 bg-primary/[0.06] text-primary'
                    : 'border-transparent text-muted-foreground/60 hover:border-border/50 hover:text-foreground'
                )}
              >
                <g.Icon className="h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold">{g.label}</p>
                  <p className="text-[10px] opacity-50">{g.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Context (optional) */}
        <section className="rounded-2xl border border-border/50 bg-card p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">
            Context{' '}
            <span className="font-normal normal-case tracking-normal opacity-60">
              — optional
            </span>
          </p>
          <textarea
            value={stepContext}
            onChange={(e) => setStepContext(e.target.value)}
            placeholder="e.g. targeting devs who use Slack daily…"
            maxLength={300}
            rows={3}
            className="w-full resize-none rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/35 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          {stepContext.length > 0 && (
            <p className="mt-1 text-right text-[9px] text-muted-foreground/30">
              {stepContext.length}/300
            </p>
          )}
        </section>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={loading}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-150',
            'bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(0,119,182,0.3)]',
            'hover:opacity-95 hover:shadow-[0_6px_20px_rgba(0,119,182,0.4)]',
            'active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate
            </>
          )}
        </button>

        {/* Tip */}
        <div className="flex items-start gap-2 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
          <Zap className="mt-0.5 h-3 w-3 shrink-0 text-primary/50" />
          <p className="text-[10px] leading-relaxed text-muted-foreground/40">
            Click the <XIcon className="inline h-2.5 w-2.5 text-sky-400" /> or{' '}
            <MessageSquare className="inline h-2.5 w-2.5 text-orange-400" />{' '}
            buttons on roadmap nodes to auto-generate content from your steps.
          </p>
        </div>
      </aside>

      {/* ── Right panel: generated items ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <div className="mb-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary/60" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          </div>
        )}

        {items.length > 0 ? (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onDelete={(id) => deleteContentItem(ideaId, id)}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-muted/20">
              <FileText className="h-7 w-7 text-muted-foreground/20" />
            </div>
            <div className="max-w-[220px]">
              <p className="text-sm font-semibold text-muted-foreground/50">
                No content yet
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground/35">
                Pick a format and goal, then hit Generate to create your first
                post.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

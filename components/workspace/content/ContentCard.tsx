'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Share2,
  Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';
import { XPostPreview } from './XPostPreview';
import type { ContentItem } from '@/types/workspace.types';

interface ContentCardProps {
  item: ContentItem;
  onDelete: (id: string) => void;
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }
  return { copied, copy };
}

// Splits AI-generated Reddit text into title + body when the model uses "Title: …\n"
function parseReddit(text: string): { title: string | null; body: string } {
  const m = text.match(/^Title:\s*(.+?)(?:\n|$)([\s\S]*)/);
  if (m) return { title: m[1].trim(), body: m[2].trim() };
  return { title: null, body: text };
}

function RedditCard({ item, onDelete }: ContentCardProps) {
  const { copied, copy } = useCopy(item.text);
  const { title, body } = parseReddit(item.text);
  const wordCount = item.text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = item.text.length;

  return (
    <div className="group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2.5">
        <span className="text-[11px] font-bold text-orange-500">
          r/startups
        </span>
        <span className="text-[10px] text-muted-foreground/40">·</span>
        <span className="text-[10px] text-muted-foreground/50">
          Posted by{' '}
          <span className="text-muted-foreground/70">u/ideapickapp</span>
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={copy}
            title="Copy"
            className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-background/40 px-2 py-1 text-[10px] font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            title="Delete"
            className="rounded-lg border border-border/40 bg-background/40 p-1 text-muted-foreground/40 transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-0">
        {/* Upvote column */}
        <div className="flex w-10 shrink-0 flex-col items-center gap-0.5 bg-muted/20 py-4">
          <button className="rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-orange-500/10 hover:text-orange-500">
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-bold text-muted-foreground/50">
            0
          </span>
          <button className="rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-blue-500/10 hover:text-blue-500">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 px-4 py-3">
          {title && (
            <p className="mb-2 text-[15px] font-semibold leading-snug text-foreground">
              {title}
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/75">
            {body}
          </p>

          {/* Footer actions */}
          <div className="mt-3 flex items-center gap-1 border-t border-border/20 pt-3">
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-muted-foreground/50 transition-colors hover:bg-muted/30 hover:text-foreground">
              <MessageSquare className="h-3.5 w-3.5" /> Comments
            </button>
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-muted-foreground/50 transition-colors hover:bg-muted/30 hover:text-foreground">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-muted-foreground/50 transition-colors hover:bg-muted/30 hover:text-foreground">
              <Bookmark className="h-3.5 w-3.5" /> Save
            </button>
            <span className="ml-auto text-[10px] text-muted-foreground/30">
              {wordCount} words · {charCount} chars
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function XCard({ item, onDelete }: ContentCardProps) {
  const { copied, copy } = useCopy(item.text);

  return (
    <div className="group relative">
      <XPostPreview text={item.text} />
      {/* Actions pinned inside the card's top-right corner */}
      <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={copy}
          title="Copy"
          className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/90 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground backdrop-blur-sm transition-all hover:border-border hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
        <button
          onClick={() => onDelete(item.id)}
          title="Delete"
          className="rounded-lg border border-border/60 bg-card/90 p-1.5 text-muted-foreground/40 backdrop-blur-sm transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ContentCard({ item, onDelete }: ContentCardProps) {
  if (item.type === 'tweet') return <XCard item={item} onDelete={onDelete} />;
  return <RedditCard item={item} onDelete={onDelete} />;
}

'use client';

import { useState } from 'react';
import { Copy, Check, Trash2, Twitter, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ContentItem } from '@/types/workspace.types';

interface ContentCardProps {
  item:     ContentItem;
  onDelete: (id: string) => void;
}

const TYPE_CONFIG = {
  tweet: {
    Icon:        Twitter,
    label:       'Tweet',
    pill:        'text-sky-400 bg-sky-400/10 border-sky-400/20',
    accentBar:   'bg-sky-400/60',
  },
  reddit: {
    Icon:        MessageSquare,
    label:       'Reddit',
    pill:        'text-orange-400 bg-orange-400/10 border-orange-400/20',
    accentBar:   'bg-orange-400/60',
  },
};

export function ContentCard({ item, onDelete }: ContentCardProps) {
  const [copied, setCopied]   = useState(false);
  const config                = TYPE_CONFIG[item.type];
  const Icon                  = config.Icon;

  const charCount = item.text.length;
  const wordCount = item.text.trim().split(/\s+/).filter(Boolean).length;
  const createdAt = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  async function copy() {
    await navigator.clipboard.writeText(item.text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Type accent bar */}
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', config.accentBar)} />

      <div className="px-5 py-4 pl-6">
        {/* Header row */}
        <div className="mb-3 flex items-center gap-2.5">
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
              config.pill
            )}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>

          {item.context && (
            <span className="truncate text-[10px] text-muted-foreground/40">
              via: {item.context}
            </span>
          )}

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={copy}
              title="Copy"
              className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/60 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground"
            >
              {copied
                ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
                : <><Copy className="h-3 w-3" /> Copy</>
              }
            </button>
            <button
              onClick={() => onDelete(item.id)}
              title="Delete"
              className="rounded-lg border border-border/50 bg-background/60 p-1.5 text-muted-foreground/40 transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content text */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
          {item.text}
        </p>

        {/* Footer meta */}
        <div className="mt-3 flex items-center gap-3 border-t border-border/30 pt-3">
          <span className="text-[10px] text-muted-foreground/35">
            {wordCount} words · {charCount} chars
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground/30">{createdAt}</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnhancedValidationResult } from '@/lib/schemas';

interface ValidationHistoryCardProps {
  id: string;
  description: string;
  productType: string | null;
  result: EnhancedValidationResult;
  createdAt: string | number;
  onDelete: () => void;
  onRename: (description: string) => void;
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-400 bg-emerald-400/10';
  if (score >= 40) return 'text-amber-400 bg-amber-400/10';
  return 'text-rose-400 bg-rose-400/10';
}

function decisionColor(decision: string) {
  if (decision === 'proceed') return 'text-emerald-400 bg-emerald-400/10';
  if (decision === 'test-first') return 'text-amber-400 bg-amber-400/10';
  return 'text-rose-400 bg-rose-400/10';
}

function relativeDate(raw: string | number) {
  const ms = typeof raw === 'number' ? raw : new Date(raw).getTime();
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function ValidationHistoryCard({
  id,
  description,
  productType,
  result,
  createdAt,
  onDelete,
  onRename,
}: ValidationHistoryCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(description);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => { setEditValue(description); }, [description]);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  function openMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ top: rect.bottom + 4, left: rect.right - 132 });
    setMenuOpen((o) => !o);
  }

  function commitRename() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== description) onRename(trimmed);
    else setEditValue(description);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setEditValue(description); setEditing(false); }
  }

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-border/80 hover:bg-card/90"
      onClick={() => !editing && router.push(`/validate/${id}`)}
    >
      {/* Score + decision badges */}
      <div className="flex items-center gap-2">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums', scoreColor(result.score))}>
          {result.score}/100
        </span>
        {result.decision && (
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', decisionColor(result.decision))}>
            {result.decision.replace('-', ' ')}
          </span>
        )}
      </div>

      {/* Description / editable title */}
      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
        />
      ) : (
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/90">
          {description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
        {productType && (
          <span className="rounded bg-white/5 px-1.5 py-0.5">{productType}</span>
        )}
        <span className="ml-auto">{relativeDate(createdAt)}</span>
      </div>

      {/* Menu button */}
      {!editing && (
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => { e.stopPropagation(); openMenu(e); }}
          className={cn(
            'absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded transition-colors',
            menuOpen
              ? 'text-foreground'
              : 'text-transparent group-hover:text-muted-foreground/50 hover:!text-foreground'
          )}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      )}

      {mounted && menuOpen && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
          className="z-[200] min-w-[132px] overflow-hidden rounded-lg border border-white/10 bg-[#0d1e33] py-1 shadow-xl"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setEditing(true); }}
            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
            Rename
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrainstormHistoryCardProps {
  id: string;
  prompt: string;
  productType: string | null;
  ideasCount: number;
  createdAt: string | number;
  onDelete: () => void;
  onRename: (prompt: string) => void;
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

export function BrainstormHistoryCard({
  id,
  prompt,
  productType,
  ideasCount,
  createdAt,
  onDelete,
  onRename,
}: BrainstormHistoryCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(prompt);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => { setEditValue(prompt); }, [prompt]);

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
    if (trimmed && trimmed !== prompt) onRename(trimmed);
    else setEditValue(prompt);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setEditValue(prompt); setEditing(false); }
  }

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-border/80 hover:bg-card/90"
      onClick={() => !editing && router.push(`/brainstorms/${id}`)}
    >
      {/* Ideas count badge */}
      <div className="flex items-center gap-1.5">
        <Lightbulb className="h-3 w-3 text-amber-400/70" />
        <span className="text-[10px] font-bold text-amber-400/80">
          {ideasCount} idea{ideasCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Prompt / editable title */}
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
          {prompt}
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

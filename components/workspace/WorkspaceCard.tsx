'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { relativeDate } from '@/lib/validate/format';

interface WorkspaceCardProps {
  id: string;
  title: string;
  description?: string;
  updatedAt?: string;
  onDelete?: () => void;
  onRename?: (title: string) => void;
}

export function WorkspaceCard({
  id,
  title,
  description,
  updatedAt,
  onDelete,
  onRename,
}: WorkspaceCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);
  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      )
        setMenuOpen(false);
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
    if (trimmed && trimmed !== title) onRename?.(trimmed);
    else setEditValue(title);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      setEditValue(title);
      setEditing(false);
    }
  }

  const showMenu = Boolean(onDelete || onRename);

  return (
    <div
      className="group relative flex h-full min-h-[140px] cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-border/80 hover:bg-card/90"
      onClick={() => !editing && router.push(`/workspace/${id}`)}
    >
      {editing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="h-auto w-full border-0 bg-transparent p-0 text-sm font-semibold text-foreground shadow-none focus-visible:ring-0 rounded-none"
        />
      ) : (
        <h3 className="line-clamp-2 pr-7 text-sm font-semibold leading-snug text-foreground/90">
          {title}
        </h3>
      )}

      {description && (
        <p className="line-clamp-2 text-xs text-muted-foreground/70">
          {description}
        </p>
      )}

      {updatedAt && (
        <div className="mt-auto text-[11px] text-muted-foreground/50">
          Updated {relativeDate(updatedAt)}
        </div>
      )}

      {showMenu && !editing && (
        <Button
          ref={buttonRef}
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            openMenu(e);
          }}
          className={cn(
            'absolute right-3 top-3 h-6 w-6',
            menuOpen
              ? 'text-foreground'
              : 'text-transparent group-hover:text-muted-foreground/50 hover:!text-foreground'
          )}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      )}

      {mounted &&
        menuOpen &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
            className="z-[200] min-w-[132px] overflow-hidden rounded-lg border border-white/10 bg-[#0d1e33] py-1 shadow-xl"
          >
            {onRename && (
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setEditing(true);
                }}
                className="w-full justify-start gap-2.5 rounded-lg px-3 py-1.5 h-auto text-xs font-normal normal-case tracking-normal text-foreground/70 hover:bg-white/5 hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                Rename
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full justify-start gap-2.5 rounded-lg px-3 py-1.5 h-auto text-xs font-normal normal-case tracking-normal text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BrainstormItemProps {
  id: string;
  prompt: string;
  onDelete: () => void;
  onRename: (newPrompt: string) => void;
  onNavigate?: () => void;
}

export function BrainstormItem({
  id,
  prompt,
  onDelete,
  onRename,
  onNavigate,
}: BrainstormItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/brainstorms/${id}`;

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(prompt);
  const [mounted, setMounted] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setEditValue(prompt); }, [prompt]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function openMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 132 });
    }
    setMenuOpen((o) => !o);
  }

  function commitRename() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== prompt) onRename(trimmed);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      setEditValue(prompt);
      setEditing(false);
    }
  }

  return (
    <div className={cn('group relative flex items-center rounded-lg', isActive && 'bg-white/8')}>
      {editing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          className="h-auto w-full border-0 bg-transparent py-2 pl-3 pr-7 text-sm text-foreground/90 shadow-none focus-visible:ring-0 rounded-none"
        />
      ) : (
        <Link
          href={`/brainstorms/${id}`}
          onClick={onNavigate}
          className={cn(
            'flex min-w-0 flex-1 items-center rounded-lg py-2 pl-3 pr-7 text-sm transition-colors',
            isActive
              ? 'text-foreground/90'
              : 'text-foreground/45 hover:text-foreground/80'
          )}
        >
          <span className="overflow-hidden whitespace-nowrap">{prompt}</span>
        </Link>
      )}

      {!editing && (
        <Button
          ref={buttonRef}
          type="button"
          variant="ghost"
          size="icon"
          onClick={openMenu}
          className={cn(
            'absolute right-1 h-6 w-6',
            menuOpen
              ? 'text-foreground'
              : 'text-transparent group-hover:text-muted-foreground/70 hover:!text-foreground'
          )}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      )}

      {mounted && menuOpen && menuPos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
            className="z-[200] min-w-[132px] overflow-hidden rounded-lg border border-white/10 bg-[#0d1e33] py-1 shadow-xl"
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setMenuOpen(false); setEditing(true); }}
              className="w-full justify-start gap-2.5 rounded-lg px-3 py-1.5 h-auto text-xs font-normal normal-case tracking-normal text-foreground/70 hover:bg-white/8 hover:text-foreground"
            >
              <Pencil className="h-3 w-3" />
              Rename
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full justify-start gap-2.5 rounded-lg px-3 py-1.5 h-auto text-xs font-normal normal-case tracking-normal text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>,
          document.body
        )}
    </div>
  );
}

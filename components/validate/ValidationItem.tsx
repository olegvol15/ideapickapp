'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationItemProps {
  id: string;
  description: string;
  onDelete: () => void;
  onNavigate?: () => void;
}

export function ValidationItem({
  id,
  description,
  onDelete,
  onNavigate,
}: ValidationItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/validate/${id}`;

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

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

  function openMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 132 });
    }
    setMenuOpen((o) => !o);
  }

  return (
    <div className={cn('group relative flex items-center rounded-lg', isActive && 'bg-white/8')}>
      <Link
        href={`/validate/${id}`}
        onClick={onNavigate}
        className={cn(
          'flex min-w-0 flex-1 items-center rounded-lg py-2 pl-3 pr-7 text-sm transition-colors',
          isActive
            ? 'text-foreground/90'
            : 'text-foreground/45 hover:text-foreground/80'
        )}
      >
        <span className="overflow-hidden whitespace-nowrap">{description}</span>
      </Link>

      <button
        ref={buttonRef}
        type="button"
        onClick={openMenu}
        className={cn(
          'absolute right-1 flex h-6 w-6 items-center justify-center transition-colors',
          menuOpen
            ? 'text-foreground'
            : 'text-transparent group-hover:text-muted-foreground/70 hover:!text-foreground'
        )}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {mounted && menuOpen && menuPos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
            className="z-[200] min-w-[132px] overflow-hidden rounded-lg border border-white/10 bg-[#0d1e33] py-1 shadow-xl"
          >
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onDelete(); }}
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

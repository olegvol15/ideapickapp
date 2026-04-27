'use client';

import { createPortal } from 'react-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ValidationContextMenuProps {
  isOpen: boolean;
  position: { top: number; left: number };
  menuRef: React.RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  onRenameStart: () => void;
  onDelete: () => void;
}

export function ValidationContextMenu({
  isOpen,
  position,
  menuRef,
  isEditing,
  onRenameStart,
  onDelete,
}: ValidationContextMenuProps) {
  if (!isOpen || isEditing) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: position.top, left: position.left }}
      className="z-[200] min-w-[132px] overflow-hidden rounded-lg border border-white/10 bg-[#0d1e33] py-1 shadow-xl"
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onRenameStart}
        className="w-full justify-start gap-2.5 rounded-lg px-3 py-1.5 h-auto text-xs font-normal normal-case tracking-normal text-foreground/70 hover:bg-white/5 hover:text-foreground"
      >
        <Pencil className="h-3 w-3" />
        Rename
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onDelete}
        className="w-full justify-start gap-2.5 rounded-lg px-3 py-1.5 h-auto text-xs font-normal normal-case tracking-normal text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </Button>
    </div>,
    document.body
  );
}

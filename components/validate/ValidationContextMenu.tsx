'use client';

import { createPortal } from 'react-dom';
import { Pencil, Trash2 } from 'lucide-react';

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
      <button
        type="button"
        onClick={onRenameStart}
        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <Pencil className="h-3 w-3" />
        Rename
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </button>
    </div>,
    document.body,
  );
}

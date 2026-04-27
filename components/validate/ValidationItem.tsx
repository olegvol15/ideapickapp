'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ValidationContextMenu } from './ValidationContextMenu';
import { useEditableValidation } from '@/hooks/use-editable-validation';

interface ValidationItemProps {
  id: string;
  description: string;
  onDelete: () => void;
  onRename: (description: string) => void;
  onNavigate?: () => void;
}

export function ValidationItem({
  id,
  description,
  onDelete,
  onRename,
  onNavigate,
}: ValidationItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/validate/${id}`;

  const {
    menuOpen,
    menuPos,
    mounted,
    editing,
    editValue,
    setEditValue,
    buttonRef,
    menuRef,
    inputRef,
    openMenu,
    startEdit,
    cancelMenu,
    commitRename,
    handleKeyDown,
  } = useEditableValidation(description, onRename);

  return (
    <div
      className={cn(
        'group relative flex items-center rounded-lg',
        isActive && 'bg-white/8'
      )}
    >
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
          href={`/validate/${id}`}
          onClick={onNavigate}
          className={cn(
            'flex min-w-0 flex-1 items-center rounded-lg py-2 pl-3 pr-7 text-sm transition-colors',
            isActive
              ? 'text-foreground/90'
              : 'text-foreground/45 hover:text-foreground/80'
          )}
        >
          <span className="overflow-hidden whitespace-nowrap">
            {description}
          </span>
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

      {mounted && menuPos && (
        <ValidationContextMenu
          isOpen={menuOpen}
          position={menuPos}
          menuRef={menuRef}
          isEditing={editing}
          onRenameStart={startEdit}
          onDelete={() => {
            cancelMenu();
            onDelete();
          }}
        />
      )}
    </div>
  );
}

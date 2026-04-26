'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkspaceTask, TaskStatus } from '@/types/workspace.types';

const STATUS_LINE: Record<TaskStatus, string> = {
  todo:        'bg-muted-foreground/20',
  in_progress: 'bg-amber-400',
  done:        'bg-emerald-400',
};

interface TodoCardProps {
  task:      WorkspaceTask;
  status?:   TaskStatus;
  onDelete:  (id: string) => void;
  isOverlay?: boolean;
}

export function TodoCard({ task, status, onDelete, isOverlay }: TodoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const createdAt = new Date(task.createdAt);
  const dateLabel = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative flex select-none items-start gap-0 overflow-hidden rounded-xl border bg-card shadow-sm',
        'transition-all duration-150',
        isDragging && !isOverlay && 'opacity-20 shadow-none',
        isOverlay  && 'rotate-[1deg] scale-[1.02] shadow-2xl ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
        !isDragging && !isOverlay && 'border-border/50 hover:border-border hover:shadow-md'
      )}
    >
      {/* Status accent line */}
      <span className={cn('absolute left-0 inset-y-0 w-[3px] rounded-l-xl', status ? STATUS_LINE[status] : 'bg-muted-foreground/20')} />

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className="ml-3 mr-0.5 mt-[13px] shrink-0 cursor-grab text-muted-foreground/15 transition-colors hover:text-muted-foreground/50 active:cursor-grabbing group-hover:text-muted-foreground/30"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Task body */}
      <div className="flex min-w-0 flex-1 flex-col px-2 py-3">
        <p className="text-[13px] font-medium leading-snug text-foreground/90">
          {task.title}
        </p>
        <p className="mt-1.5 text-[10px] text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">
          Added {dateLabel}
        </p>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="mr-2.5 mt-[11px] shrink-0 rounded-md p-1 text-muted-foreground/0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:text-muted-foreground/30"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

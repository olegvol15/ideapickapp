'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, CalendarDays, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkspaceTask, TaskStatus, TaskPriority } from '@/types/workspace.types';

const STATUS_LINE: Record<TaskStatus, string> = {
  todo: 'bg-muted-foreground/20',
  in_progress: 'bg-amber-400',
  done: 'bg-emerald-400',
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: 'bg-muted-foreground/30',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
};

const PRIORITY_TEXT: Record<TaskPriority, string> = {
  low: 'text-muted-foreground/40',
  medium: 'text-amber-500',
  high: 'text-rose-500',
};

function formatDueDate(dueDate: string): { label: string; overdue: boolean } {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = due < today;
  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, overdue };
}

interface TodoCardProps {
  task: WorkspaceTask;
  onDelete: (id: string) => void;
  isOverlay?: boolean;
}

export function TodoCard({ task, onDelete, isOverlay }: TodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const due = task.dueDate ? formatDueDate(task.dueDate) : null;
  const priority = task.priority ?? 'medium';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative flex select-none items-start gap-0 overflow-hidden rounded-xl border bg-card shadow-sm',
        'transition-all duration-150',
        isDragging && !isOverlay && 'opacity-20 shadow-none',
        isOverlay &&
          'rotate-[1deg] scale-[1.02] shadow-2xl ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
        !isDragging && !isOverlay && 'border-border/50 hover:border-border hover:shadow-md'
      )}
    >
      {/* Status accent line */}
      <span
        className={cn(
          'absolute left-0 inset-y-0 w-[3px] rounded-l-xl',
          STATUS_LINE[task.status]
        )}
      />

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
      <div className="flex min-w-0 flex-1 flex-col px-2 py-3 pr-1">
        <p className="text-[13px] font-medium leading-snug text-foreground/90">
          {task.title}
        </p>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/50">
            {task.description}
          </p>
        )}

        {(due || priority !== 'medium') && (
          <div className="mt-2 flex items-center gap-2">
            {/* Priority chip — only shown for low/high (medium is the default, no noise) */}
            {priority !== 'medium' && (
              <span className={cn('flex items-center gap-1 text-[10px] font-semibold', PRIORITY_TEXT[priority])}>
                {priority === 'high' && <AlertCircle className="h-2.5 w-2.5" />}
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[priority], priority === 'high' && 'hidden')}
                />
                {PRIORITY_LABEL[priority]}
              </span>
            )}

            {/* Due date */}
            {due && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[10px] font-medium',
                  due.overdue ? 'text-rose-500' : 'text-muted-foreground/40'
                )}
              >
                <CalendarDays className="h-2.5 w-2.5" />
                {due.overdue ? `Overdue · ${due.label}` : due.label}
              </span>
            )}
          </div>
        )}
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

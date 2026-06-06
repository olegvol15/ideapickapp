'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, CalendarDays, AlertCircle, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkspaceTask, TaskPriority } from '@/types/workspace.types';

// Priority drives the accent stripe — status is already communicated by the column.
const PRIORITY_STRIPE: Record<TaskPriority, string> = {
  low: 'bg-sky-400/50',
  medium: 'bg-amber-400/80',
  high: 'bg-rose-500',
};

const PRIORITY_CHIP: Record<TaskPriority, { text: string; cls: string }> = {
  low: { text: 'Low', cls: 'text-sky-500 dark:text-sky-400' },
  medium: { text: 'Med', cls: 'text-amber-500' },
  high: { text: 'High', cls: 'text-rose-500 font-bold' },
};

function formatDueDate(raw: string): { label: string; overdue: boolean } {
  const due = new Date(raw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: due < today,
  };
}

interface TodoCardProps {
  task: WorkspaceTask;
  onEdit: (task: WorkspaceTask) => void;
  onDelete: (id: string) => void;
  isOverlay?: boolean;
}

export function TodoCard({ task, onEdit, onDelete, isOverlay }: TodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const priority = task.priority ?? 'medium';
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;
  const isDone = task.status === 'done';
  const showMeta = due || priority !== 'medium';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative flex select-none overflow-hidden rounded-xl border bg-card shadow-sm',
        'transition-all duration-150',
        isDragging && !isOverlay && 'opacity-20 shadow-none',
        isOverlay && 'shadow-2xl ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
        !isDragging && !isOverlay && 'border-border/50 hover:border-border hover:shadow-md hover:bg-card/80'
      )}
    >
      {/* Priority accent stripe */}
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', PRIORITY_STRIPE[priority])} />

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Drag task"
        className="ml-3 mt-3 mr-1 shrink-0 self-start cursor-grab text-muted-foreground/20 transition-colors active:cursor-grabbing group-hover:text-muted-foreground/45"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Clickable body — opens edit */}
      <button
        onClick={() => { if (!isDragging) onEdit(task); }}
        className="flex min-w-0 flex-1 flex-col gap-1 py-3 pl-1.5 pr-2 text-left"
      >
        <p
          className={cn(
            'text-[13px] font-medium leading-snug text-foreground/90 transition-colors',
            isDone && 'text-muted-foreground/50 line-through'
          )}
        >
          {task.title}
        </p>

        {task.description && (
          <p className="line-clamp-1 text-[11px] leading-relaxed text-muted-foreground/45">
            {task.description}
          </p>
        )}

        {showMeta && (
          <div className="mt-0.5 flex items-center gap-2.5">
            {priority !== 'medium' && (
              <span className={cn('flex items-center gap-1 text-[10px] leading-none', PRIORITY_CHIP[priority].cls)}>
                {priority === 'high'
                  ? <ArrowUp className="h-2.5 w-2.5" />
                  : <span className="h-1.5 w-1.5 rounded-full bg-sky-400/70" />}
                {PRIORITY_CHIP[priority].text}
              </span>
            )}

            {due && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[10px] leading-none font-medium',
                  due.overdue ? 'text-rose-500' : 'text-muted-foreground/40'
                )}
              >
                {due.overdue && <AlertCircle className="h-2.5 w-2.5" />}
                {!due.overdue && <CalendarDays className="h-2.5 w-2.5" />}
                {due.overdue ? `Overdue · ${due.label}` : due.label}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Delete — hover-reveal */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        aria-label="Delete task"
        className="mr-2 mt-2.5 shrink-0 self-start rounded-md p-1 opacity-0 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 text-muted-foreground/35"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TodoCard } from './TodoCard';
import { AddTaskInput } from './AddTaskInput';
import type { WorkspaceTask, TaskStatus } from '@/types/workspace.types';

const COLUMN_META: Record<
  TaskStatus,
  { label: string; accent: string; glow: string; emptyText: string }
> = {
  todo: {
    label:     'To Do',
    accent:    'bg-muted-foreground/25',
    glow:      'border-border/60 bg-card/40',
    emptyText: 'Drop tasks here or add one below',
  },
  in_progress: {
    label:     'In Progress',
    accent:    'bg-amber-400',
    glow:      'border-amber-400/20 bg-amber-400/[0.03]',
    emptyText: 'Move tasks here when you start them',
  },
  done: {
    label:     'Done',
    accent:    'bg-emerald-400',
    glow:      'border-emerald-400/20 bg-emerald-400/[0.03]',
    emptyText: 'Completed tasks will appear here',
  },
};

interface TodoColumnProps {
  status:   TaskStatus;
  tasks:    WorkspaceTask[];
  onAdd:    (title: string) => void;
  onDelete: (id: string) => void;
}

export function TodoColumn({ status, tasks, onAdd, onDelete }: TodoColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = COLUMN_META[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-0 flex-1 flex-col rounded-2xl border transition-all duration-200',
        isOver ? meta.glow : 'border-border/40 bg-card/30'
      )}
    >
      {/* Column header */}
      <div className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-3">
        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', meta.accent)} />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {meta.label}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {tasks.length > 0 && (
            <span className="min-w-[18px] rounded-full bg-muted/70 px-1.5 py-px text-center text-[10px] font-bold tabular-nums text-muted-foreground/60">
              {tasks.length}
            </span>
          )}
          <button
            onClick={() => {
              // Focus the add-task input by triggering a custom event
              const el = document.getElementById(`add-task-${status}`);
              el?.click();
            }}
            className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/30 transition-colors hover:bg-muted/60 hover:text-muted-foreground/80"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Cards list — independently scrollable */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-0 flex-1 overflow-y-auto px-2.5">
          <div className="flex flex-col gap-2 py-1 pb-2">
            {tasks.map(task => (
              <TodoCard key={task.id} task={task} onDelete={onDelete} status={status} />
            ))}

            {tasks.length === 0 && (
              <div
                className={cn(
                  'mx-1 mt-1 flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center transition-colors duration-200',
                  isOver
                    ? 'border-primary/40 bg-primary/[0.04]'
                    : 'border-border/30 bg-transparent'
                )}
              >
                <p className="text-[11px] text-muted-foreground/30">{meta.emptyText}</p>
              </div>
            )}
          </div>
        </div>
      </SortableContext>

      {/* Add task — sticky footer */}
      <div className="shrink-0 border-t border-border/30 p-2">
        <AddTaskInput id={`add-task-${status}`} onAdd={onAdd} />
      </div>
    </div>
  );
}

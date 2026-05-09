'use client';

import { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { CalendarDays, Pencil, Trash2, AlertCircle } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '@/types/workspace.types';

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: 'border-sky-400/30 text-sky-500 dark:text-sky-400',
  medium: 'border-amber-400/30 text-amber-500',
  high: 'border-rose-500/30 text-rose-500',
};

const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-muted-foreground/40',
  in_progress: 'bg-amber-500',
  done: 'bg-emerald-500',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDueDate(raw: string): { label: string; overdue: boolean } {
  const due = new Date(raw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    overdue: due < today,
  };
}

interface TaskDetailSheetProps {
  ideaId: string;
}

export function TaskDetailSheet({ ideaId }: TaskDetailSheetProps) {
  const { selectedTaskId, todos, setSelectedTask, updateTask, deleteTask } = useWorkspaceStore();
  const task = (todos[ideaId] ?? []).find((t) => t.id === selectedTaskId) ?? null;

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
  }, [selectedTaskId]);

  function enterEdit() {
    if (!task) return;
    setEditTitle(task.title);
    setEditDesc(task.description ?? '');
    setEditing(true);
    requestAnimationFrame(() => titleInputRef.current?.focus());
  }

  function saveEdit() {
    if (!task || !editTitle.trim()) return;
    updateTask(ideaId, task.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
    });
    setEditing(false);
  }

  function handleDelete() {
    if (!task) return;
    deleteTask(ideaId, task.id);
    setSelectedTask(null);
  }

  const priority = task?.priority ?? 'medium';
  const due = task?.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTask(null)}>
      <SheetContent>
        {task && (
          <div className="flex h-full flex-col">
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-[10px] uppercase tracking-widest', PRIORITY_BADGE[priority])}
                >
                  {priority === 'high' && <AlertCircle className="mr-1 h-2.5 w-2.5" />}
                  {PRIORITY_LABEL[priority]}
                </Badge>
                {!editing && (
                  <button
                    onClick={enterEdit}
                    className="ml-auto text-muted-foreground/40 transition-colors hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {editing ? (
                <div className="mt-1 flex flex-col gap-2">
                  <Input
                    ref={titleInputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className="text-sm font-semibold"
                  />
                  <Textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Add notes…"
                    className="h-28 resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={!editTitle.trim()}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <SheetTitle className="leading-snug">{task.title}</SheetTitle>
              )}
            </SheetHeader>

            {!editing && (
              <div className="flex flex-1 flex-col overflow-y-auto">
                <Separator className="mb-4" />

                {task.description ? (
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {task.description}
                  </p>
                ) : (
                  <p className="mb-4 text-sm italic text-muted-foreground/35">No notes.</p>
                )}

                <Separator className="mb-4" />

                <div className="flex flex-col gap-4">
                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Status
                    </p>
                    <Select
                      value={task.status}
                      onValueChange={(v) => updateTask(ideaId, task.id, { status: v as TaskStatus })}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[task.status])} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            <div className="flex items-center gap-2">
                              <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[s])} />
                              {STATUS_LABEL[s]}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Priority
                    </p>
                    <Select
                      value={priority}
                      onValueChange={(v) => updateTask(ideaId, task.id, { priority: v as TaskPriority })}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORITY_LABEL[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due date */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Due Date
                    </p>
                    <Input
                      type="date"
                      value={task.dueDate ?? ''}
                      onChange={(e) =>
                        updateTask(ideaId, task.id, { dueDate: e.target.value || undefined })
                      }
                      className="h-9 text-sm"
                    />
                    {due && (
                      <p
                        className={cn(
                          'flex items-center gap-1 text-[11px]',
                          due.overdue ? 'text-rose-500' : 'text-muted-foreground/50'
                        )}
                      >
                        {due.overdue && <AlertCircle className="h-3 w-3" />}
                        {!due.overdue && <CalendarDays className="h-3 w-3" />}
                        {due.overdue ? `Overdue since ${due.label}` : due.label}
                      </p>
                    )}
                  </div>

                  {/* Created meta */}
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Created
                    </p>
                    <p className="text-[12px] text-muted-foreground/50">
                      {formatDate(task.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Delete */}
                <div className="mt-auto pt-8">
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete task
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-[11px] text-muted-foreground/70">
                        Delete this task?
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={handleDelete}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

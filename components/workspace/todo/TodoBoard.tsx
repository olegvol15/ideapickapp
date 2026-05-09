'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { TodoColumn } from './TodoColumn';
import { TodoCard } from './TodoCard';
import { CreateTaskDialog } from './CreateTaskDialog';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { NewTask, TaskStatus, WorkspaceTask } from '@/types/workspace.types';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

interface TodoBoardProps {
  ideaId: string;
}

export function TodoBoard({ ideaId }: TodoBoardProps) {
  const { todos, addTask, deleteTask, reorderTasks } = useWorkspaceStore();
  const rawStoreTasks = todos[ideaId];

  const [tasks, setTasks] = useState<WorkspaceTask[]>(rawStoreTasks ?? []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>('todo');

  useEffect(() => {
    if (activeId) return;
    const timer = window.setTimeout(() => setTasks(rawStoreTasks ?? []), 0);
    return () => window.clearTimeout(timer);
  }, [rawStoreTasks, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeTask = activeId ? (tasks.find((t) => t.id === activeId) ?? null) : null;

  function byStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status);
  }

  function openDialog(status: TaskStatus) {
    setDialogStatus(status);
    setDialogOpen(true);
  }

  function handleCreate(task: NewTask) {
    addTask(ideaId, task);
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return;

    const dragged = tasks.find((t) => t.id === String(active.id));
    if (!dragged) return;

    const overId = String(over.id);
    const overIsColumn = (STATUSES as string[]).includes(overId);
    const overTask = tasks.find((t) => t.id === overId);
    const targetStatus: TaskStatus = overIsColumn
      ? (overId as TaskStatus)
      : (overTask?.status ?? dragged.status);

    if (dragged.status !== targetStatus) {
      setTasks((prev) =>
        prev.map((t) => (t.id === dragged.id ? { ...t, status: targetStatus } : t))
      );
    } else if (overTask && overTask.id !== dragged.id) {
      const col = tasks.filter((t) => t.status === targetStatus);
      const from = col.findIndex((t) => t.id === dragged.id);
      const to = col.findIndex((t) => t.id === overId);
      if (from !== -1 && to !== -1 && from !== to) {
        const reordered = arrayMove(col, from, to);
        setTasks((prev) => [
          ...prev.filter((t) => t.status !== targetStatus),
          ...reordered,
        ]);
      }
    }
  }

  function onDragEnd() {
    setActiveId(null);
    reorderTasks(ideaId, tasks);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex h-full gap-3">
          {STATUSES.map((status) => (
            <TodoColumn
              key={status}
              status={status}
              tasks={byStatus(status)}
              onAdd={() => openDialog(status)}
              onDelete={(id) => deleteTask(ideaId, id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeTask && (
            <TodoCard task={activeTask} onDelete={() => {}} isOverlay />
          )}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultStatus={dialogStatus}
        onSubmit={handleCreate}
      />
    </>
  );
}

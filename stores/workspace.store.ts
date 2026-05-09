import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WorkspaceTask,
  ContentItem,
  WorkspaceTab,
  ContentType,
  TaskStatus,
  NewTask,
} from '@/types/workspace.types';
import type { Idea } from '@/types';

interface PersistedWorkspace {
  todos: Record<string, WorkspaceTask[]>;
  contentItems: Record<string, ContentItem[]>;
  workspaceTitles: Record<string, string>;
  workspaceIdeas: Record<string, Idea>;
}

interface WorkspaceStore extends PersistedWorkspace {
  activeTab: WorkspaceTab;
  pendingContent: { text: string; type: ContentType } | null;
  selectedTaskId: string | null;

  setActiveTab: (tab: WorkspaceTab) => void;
  setSelectedTask: (id: string | null) => void;
  setPendingContent: (
    content: { text: string; type: ContentType } | null
  ) => void;
  setWorkspaceTitle: (ideaId: string, title: string) => void;
  setWorkspaceIdea: (ideaId: string, idea: Idea) => void;

  addTask: (ideaId: string, task: NewTask) => void;
  updateTask: (ideaId: string, taskId: string, updates: Partial<Pick<WorkspaceTask, 'title' | 'description' | 'priority' | 'status' | 'dueDate'>>) => void;
  moveTask: (ideaId: string, taskId: string, status: TaskStatus) => void;
  deleteTask: (ideaId: string, taskId: string) => void;
  reorderTasks: (ideaId: string, tasks: WorkspaceTask[]) => void;

  addContentItem: (
    ideaId: string,
    item: Omit<ContentItem, 'id' | 'createdAt'>
  ) => void;
  deleteContentItem: (ideaId: string, itemId: string) => void;

  hydrateWorkspace: (
    ideaId: string,
    tasks: WorkspaceTask[],
    content: ContentItem[],
    idea: Idea
  ) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      todos: {},
      contentItems: {},
      workspaceTitles: {},
      workspaceIdeas: {},
      activeTab: 'todo',
      pendingContent: null,
      selectedTaskId: null,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedTask: (id) => set({ selectedTaskId: id }),
      setPendingContent: (content) => set({ pendingContent: content }),
      setWorkspaceTitle: (ideaId, title) =>
        set((s) => ({
          workspaceTitles: { ...s.workspaceTitles, [ideaId]: title },
        })),
      setWorkspaceIdea: (ideaId, idea) =>
        set((s) => ({
          workspaceIdeas: { ...s.workspaceIdeas, [ideaId]: idea },
          workspaceTitles: { ...s.workspaceTitles, [ideaId]: idea.title },
        })),

      addTask: (ideaId, task) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [ideaId]: [
              ...(s.todos[ideaId] ?? []),
              {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                ...task,
              },
            ],
          },
        })),

      updateTask: (ideaId, taskId, updates) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [ideaId]: (s.todos[ideaId] ?? []).map((t) =>
              t.id === taskId ? { ...t, ...updates } : t
            ),
          },
        })),

      moveTask: (ideaId, taskId, status) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [ideaId]: (s.todos[ideaId] ?? []).map((t) =>
              t.id === taskId ? { ...t, status } : t
            ),
          },
        })),

      deleteTask: (ideaId, taskId) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [ideaId]: (s.todos[ideaId] ?? []).filter((t) => t.id !== taskId),
          },
        })),

      reorderTasks: (ideaId, tasks) =>
        set((s) => ({
          todos: { ...s.todos, [ideaId]: tasks },
        })),

      addContentItem: (ideaId, item) =>
        set((s) => ({
          contentItems: {
            ...s.contentItems,
            [ideaId]: [
              {
                ...item,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
              },
              ...(s.contentItems[ideaId] ?? []),
            ],
          },
        })),

      deleteContentItem: (ideaId, itemId) =>
        set((s) => ({
          contentItems: {
            ...s.contentItems,
            [ideaId]: (s.contentItems[ideaId] ?? []).filter(
              (c) => c.id !== itemId
            ),
          },
        })),

      hydrateWorkspace: (ideaId, tasks, content, idea) =>
        set((s) => ({
          todos: { ...s.todos, [ideaId]: tasks },
          contentItems: { ...s.contentItems, [ideaId]: content },
          workspaceIdeas: { ...s.workspaceIdeas, [ideaId]: idea },
          workspaceTitles: { ...s.workspaceTitles, [ideaId]: idea.title },
        })),
    }),
    {
      name: 'ideapick:workspace',
      partialize: (s): PersistedWorkspace => ({
        todos: s.todos,
        contentItems: s.contentItems,
        workspaceTitles: s.workspaceTitles,
        workspaceIdeas: s.workspaceIdeas,
      }),
    }
  )
);

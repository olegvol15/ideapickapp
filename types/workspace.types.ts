export type WorkspaceTab = 'todo' | 'content' | 'roadmap';

export interface WorkspaceSnapshot {
  tasks: WorkspaceTask[] | undefined;
  content: ContentItem[] | undefined;
  title: string | undefined;
}
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type ContentType = 'tweet' | 'reddit';
export type ContentGoal = 'validate' | 'community' | 'features' | 'launch';

export interface WorkspaceTask {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  text: string;
  context?: string;
  createdAt: string;
}

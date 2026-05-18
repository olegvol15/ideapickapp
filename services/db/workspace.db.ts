import { createClient } from '@/lib/supabase/client';
import type { Idea } from '@/types';
import type { WorkspaceTask, ContentItem } from '@/types/workspace.types';

export interface WorkspaceRow {
  id: string;
  idea_slug: string;
  title: string;
  idea_json: Idea;
  tasks_json: WorkspaceTask[];
  content_json: ContentItem[];
  updated_at: string;
  created_at: string;
}

export async function upsertWorkspaceToDB(params: {
  userId: string;
  slug: string;
  title: string;
  idea: Idea;
  tasks: WorkspaceTask[];
  content: ContentItem[];
}): Promise<void> {
  if (!params.userId) throw new Error('userId required');
  const supabase = createClient();
  const { error } = await supabase.from('workspaces').upsert(
    {
      user_id: params.userId,
      idea_slug: params.slug,
      title: params.title,
      idea_json: params.idea,
      tasks_json: params.tasks,
      content_json: params.content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,idea_slug' }
  );
  if (error) throw new Error('Failed to save workspace', { cause: error });
}

export async function loadWorkspaceFromDB(userId: string, slug: string): Promise<WorkspaceRow | null> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, idea_slug, title, idea_json, tasks_json, content_json, updated_at, created_at')
    .eq('user_id', userId)
    .eq('idea_slug', slug)
    .single();
  if (error || !data) return null;
  return data as WorkspaceRow;
}

export async function listWorkspacesFromDB(userId: string): Promise<WorkspaceRow[]> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, idea_slug, title, idea_json, tasks_json, content_json, updated_at, created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return (data ?? []) as WorkspaceRow[];
}

export async function renameWorkspaceInDB(userId: string, slug: string, title: string): Promise<void> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { error } = await supabase
    .from('workspaces')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('idea_slug', slug);
  if (error) throw new Error('Failed to rename workspace', { cause: error });
}

export async function deleteWorkspaceFromDB(userId: string, slug: string): Promise<void> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('user_id', userId)
    .eq('idea_slug', slug);
  if (error) throw new Error('Failed to delete workspace', { cause: error });
}

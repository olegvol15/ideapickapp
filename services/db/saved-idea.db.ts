import { createClient } from '@/lib/supabase/client';
import type { Idea } from '@/types';

export interface SavedIdeaRow {
  id: string;
  generation_id: string | null;
  idea_json: Idea;
  created_at: string;
}

export async function saveIdeaToDB(params: {
  userId: string;
  generationId: string | null;
  idea: Idea;
}): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('saved_ideas')
    .insert({
      user_id: params.userId,
      generation_id: params.generationId,
      idea_json: params.idea,
    })
    .select('id')
    .single();

  if (error) throw new Error('Failed to save idea', { cause: error });
  return data.id;
}

export async function unsaveIdeaFromDB(userId: string, ideaId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('saved_ideas')
    .delete()
    .eq('user_id', userId)
    .eq('id', ideaId);

  if (error) throw new Error('Failed to delete idea', { cause: error });
}

export async function getSavedIdeasFromDB(userId: string): Promise<SavedIdeaRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('saved_ideas')
    .select('id, generation_id, idea_json, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []) as SavedIdeaRow[];
}

export async function isIdeaSavedInDB(userId: string, ideaTitle: string): Promise<boolean> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('saved_ideas')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('idea_json->>title', ideaTitle);

  if (error) return false;
  return (count ?? 0) > 0;
}

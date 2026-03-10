import { createClient } from '@/lib/supabase/client';
import type { GenerateResponse, Idea, ProductType, Difficulty } from '@/types';

export interface GenerationRow {
  id:           string;
  prompt:       string;
  product_type: string | null;
  difficulty:   string | null;
  result_json:  GenerateResponse;
  created_at:   string;
}

export interface SavedIdeaRow {
  id:            string;
  generation_id: string | null;
  idea_json:     Idea;
  created_at:    string;
}

export async function saveGeneration(params: {
  userId:      string;
  prompt:      string;
  productType: ProductType | '';
  difficulty:  Difficulty  | '';
  result:      GenerateResponse;
}): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('generations')
    .insert({
      user_id:      params.userId,
      prompt:       params.prompt,
      product_type: params.productType || null,
      difficulty:   params.difficulty  || null,
      result_json:  params.result,
    })
    .select('id')
    .single();

  if (error) { console.error('[db] saveGeneration', error.message); return null; }
  return data.id;
}

export async function saveIdeaToDB(params: {
  userId:       string;
  generationId: string | null;
  idea:         Idea;
}): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('saved_ideas')
    .insert({
      user_id:       params.userId,
      generation_id: params.generationId,
      idea_json:     params.idea,
    })
    .select('id')
    .single();

  if (error) { console.error('[db] saveIdeaToDB', error.message); return null; }
  return data.id;
}

export async function unsaveIdeaFromDB(userId: string, ideaTitle: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('saved_ideas')
    .delete()
    .eq('user_id', userId)
    .eq('idea_json->>title', ideaTitle);

  if (error) {
    console.error('[db] unsaveIdeaFromDB', error.message);
    throw error;
  }
}

export async function getSavedIdeasFromDB(userId: string): Promise<SavedIdeaRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('saved_ideas')
    .select('id, generation_id, idea_json, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { console.error('[db] getSavedIdeasFromDB', error.message); return []; }
  return (data ?? []) as SavedIdeaRow[];
}

export async function getGenerations(userId: string): Promise<GenerationRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('generations')
    .select('id, prompt, product_type, difficulty, result_json, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) { console.error('[db] getGenerations', error.message); return []; }
  return (data ?? []) as GenerationRow[];
}

export async function isIdeaSavedInDB(userId: string, ideaTitle: string): Promise<boolean> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('saved_ideas')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('idea_json->>title', ideaTitle);

  if (error) {
    console.error('[db] isIdeaSavedInDB', error.message);
    return false;
  }

  return (count ?? 0) > 0;
}

import { createClient } from '@/lib/supabase/client';
import type { GenerateResponse, ProductType, Difficulty } from '@/types';

export interface GenerationRow {
  id: string;
  prompt: string;
  product_type: string | null;
  difficulty: string | null;
  result_json: GenerateResponse;
  created_at: string;
}

export async function saveGeneration(params: {
  userId: string;
  prompt: string;
  productType: ProductType | '';
  difficulty: Difficulty | '';
  result: GenerateResponse;
}): Promise<string> {
  if (!params.userId) throw new Error('userId required');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('generations')
    .insert({
      user_id: params.userId,
      prompt: params.prompt,
      product_type: params.productType || null,
      difficulty: params.difficulty || null,
      result_json: params.result,
    })
    .select('id')
    .single();

  if (error) throw new Error('Failed to save generation', { cause: error });
  return data.id;
}

export async function deleteGeneration(userId: string, id: string): Promise<void> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw new Error('Failed to delete generation', { cause: error });
}

export async function renameGeneration(userId: string, id: string, prompt: string): Promise<void> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { error } = await supabase
    .from('generations')
    .update({ prompt })
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw new Error('Failed to rename generation', { cause: error });
}

export async function getGenerations(userId: string): Promise<GenerationRow[]> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('generations')
    .select('id, prompt, product_type, difficulty, result_json, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []) as GenerationRow[];
}

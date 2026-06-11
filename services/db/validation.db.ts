import { createClient } from '@/lib/supabase/client';
import type { PainEvidenceResult } from '@/lib/schemas';
import type { EvidenceSource } from '@/types/validate.types';

export interface ValidationRow {
  id: string;
  description: string;
  product_type: string | null;
  // Older rows store a legacy report shape — narrow with isPainEvidenceResult().
  result_json: unknown;
  competitors_json: EvidenceSource[];
  created_at: string;
}

export async function saveValidation(params: {
  userId: string;
  description: string;
  productType: string;
  result: PainEvidenceResult;
  sources: EvidenceSource[];
}): Promise<string> {
  if (!params.userId) throw new Error('userId required');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('validations')
    .insert({
      user_id: params.userId,
      description: params.description,
      product_type: params.productType || null,
      result_json: params.result,
      competitors_json: params.sources,
    })
    .select('id')
    .single();
  if (error) throw new Error('Failed to save validation', { cause: error });
  return data.id;
}

export async function renameValidation(userId: string, id: string, description: string): Promise<void> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { error } = await supabase
    .from('validations')
    .update({ description })
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw new Error('Failed to rename validation', { cause: error });
}

export async function updateValidation(
  userId: string,
  id: string,
  description: string,
  result: PainEvidenceResult,
  sources: EvidenceSource[]
): Promise<void> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { error } = await supabase
    .from('validations')
    .update({ description, result_json: result, competitors_json: sources })
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw new Error('Failed to update validation', { cause: error });
}

export async function deleteValidation(userId: string, id: string): Promise<void> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { error } = await supabase
    .from('validations')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw new Error('Failed to delete validation', { cause: error });
}

export async function getValidations(userId: string): Promise<ValidationRow[]> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('validations')
    .select('id, description, product_type, result_json, competitors_json, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return (data ?? []) as ValidationRow[];
}

export async function getValidation(userId: string, id: string): Promise<ValidationRow | null> {
  if (!userId) throw new Error('userId required');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('validations')
    .select('id, description, product_type, result_json, competitors_json, created_at')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as ValidationRow;
}

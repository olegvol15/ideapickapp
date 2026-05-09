import { createClient } from '@/lib/supabase/client';
import type { Idea } from '@/types';
import type { RoadmapState } from '@/services/storage.service';

export interface RoadmapRow {
  slug: string;
  title: string;
}

export interface LoadedRoadmap {
  state: RoadmapState;
  idea: Idea;
}

export async function upsertRoadmapToDB(params: {
  userId: string;
  slug: string;
  idea: Idea;
  state: RoadmapState;
  bumpTimestamp?: boolean;
}): Promise<void> {
  const supabase = createClient();
  const row: Record<string, unknown> = {
    user_id: params.userId,
    slug: params.slug,
    idea_json: params.idea,
    graph_json: params.state,
  };
  if (params.bumpTimestamp) row.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from('roadmaps')
    .upsert(row, { onConflict: 'user_id,slug' });
  if (error) throw new Error('Failed to save roadmap', { cause: error });
}

export async function loadRoadmapFromDB(params: {
  userId: string;
  slug: string;
}): Promise<LoadedRoadmap | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('roadmaps')
    .select('graph_json, idea_json')
    .eq('user_id', params.userId)
    .eq('slug', params.slug)
    .single();
  if (error || !data) return null;
  return {
    state: data.graph_json as RoadmapState,
    idea: data.idea_json as Idea,
  };
}

export async function getRoadmapsFromDB(userId: string): Promise<RoadmapRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('roadmaps')
    .select('slug, idea_json')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => ({
    slug: row.slug,
    title: (row.idea_json as Idea).title,
  }));
}

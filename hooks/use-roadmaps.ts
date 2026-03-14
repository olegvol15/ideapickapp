'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRoadmapsFromDB,
  loadRoadmapFromDB,
  upsertRoadmapToDB,
} from '@/services/db.service';
import { roadmapKeys } from '@/lib/api-keys';
import type { Idea } from '@/types';
import type { RoadmapState } from '@/services/storage.service';

export function useGetRoadmaps(userId: string | undefined) {
  return useQuery({
    queryKey: roadmapKeys.all(userId),
    queryFn: () => getRoadmapsFromDB(userId!),
    enabled: !!userId,
  });
}

export function useGetRoadmap(
  slug: string,
  userId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: roadmapKeys.bySlug(userId ?? '', slug),
    queryFn: () => loadRoadmapFromDB({ userId: userId!, slug }),
    enabled: (options?.enabled ?? true) && !!userId && !!slug,
  });
}

export function useUpsertRoadmap(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      slug: string;
      idea: Idea;
      state: RoadmapState;
      bumpTimestamp?: boolean;
    }) => {
      if (!userId) return Promise.resolve();
      return upsertRoadmapToDB({ userId, ...params });
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: roadmapKeys.all(userId) });
    },
  });
}

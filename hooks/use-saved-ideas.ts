'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSavedIdeasFromDB,
  saveIdeaToDB,
  unsaveIdeaFromDB,
  type SavedIdeaRow,
} from '@/services/db.service';
import { savedIdeaKeys } from '@/lib/api-keys';
import type { Idea } from '@/types';

export function useGetSavedIdeas(userId: string | undefined) {
  return useQuery({
    queryKey: savedIdeaKeys.all(userId),
    queryFn: () => getSavedIdeasFromDB(userId!),
    enabled: !!userId,
  });
}

export function useSaveIdea(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { generationId: string | null; idea: Idea }) => {
      if (!userId) return Promise.resolve(null);
      return saveIdeaToDB({ userId, ...params });
    },
    onMutate: async ({ idea }) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: savedIdeaKeys.all(userId) });
      const previous = queryClient.getQueryData<SavedIdeaRow[]>(
        savedIdeaKeys.all(userId)
      );
      queryClient.setQueryData<SavedIdeaRow[]>(
        savedIdeaKeys.all(userId),
        (old = []) => [
          ...old,
          {
            id: 'optimistic',
            generation_id: null,
            idea_json: idea,
            created_at: new Date().toISOString(),
          },
        ]
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (userId && ctx?.previous !== undefined) {
        queryClient.setQueryData(savedIdeaKeys.all(userId), ctx.previous);
      }
    },
    onSettled: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: savedIdeaKeys.all(userId) });
    },
  });
}

export function useUnsaveIdea(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ideaId: string) => {
      if (!userId) return Promise.resolve();
      return unsaveIdeaFromDB(userId, ideaId);
    },
    onMutate: async (ideaId) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: savedIdeaKeys.all(userId) });
      const previous = queryClient.getQueryData<SavedIdeaRow[]>(
        savedIdeaKeys.all(userId)
      );
      queryClient.setQueryData<SavedIdeaRow[]>(
        savedIdeaKeys.all(userId),
        (old = []) => old.filter((r) => r.id !== ideaId)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (userId && ctx?.previous !== undefined) {
        queryClient.setQueryData(savedIdeaKeys.all(userId), ctx.previous);
      }
    },
    onSettled: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: savedIdeaKeys.all(userId) });
    },
  });
}

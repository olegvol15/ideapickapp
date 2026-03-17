'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  saveGeneration,
  deleteGeneration,
  renameGeneration,
  getGenerations,
} from '@/services/db.service';
import { generationKeys } from '@/lib/api-keys';
import type {
  GenerateResponse,
  ProductType,
  Difficulty,
} from '@/types';

export function useSaveGeneration(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      prompt: string;
      productType: ProductType | '';
      difficulty: Difficulty | '';
      result: GenerateResponse;
    }) => {
      if (!userId) return Promise.resolve(null);
      return saveGeneration({ userId, ...params });
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: generationKeys.all(userId) });
    },
  });
}

export function useDeleteGeneration(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!userId) return Promise.resolve();
      return deleteGeneration(userId, id);
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: generationKeys.all(userId) });
    },
  });
}

export function useRenameGeneration(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, prompt }: { id: string; prompt: string }) => {
      if (!userId) return Promise.resolve();
      return renameGeneration(userId, id, prompt);
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: generationKeys.all(userId) });
    },
  });
}

export function useGetGenerations(userId: string | undefined) {
  return useQuery({
    queryKey: generationKeys.all(userId),
    queryFn: () => getGenerations(userId!),
    enabled: !!userId,
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateIdeas } from '@/services/generate.service';
import { saveGeneration, getGenerations } from '@/services/db.service';
import { generationKeys } from '@/lib/api-keys';
import type {
  GenerateRequest,
  GenerateResponse,
  ProductType,
  Difficulty,
} from '@/types';

export function useGenerate() {
  return useMutation<GenerateResponse, Error, GenerateRequest>({
    mutationFn: generateIdeas,
  });
}

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

export function useGetGenerations(userId: string | undefined) {
  return useQuery({
    queryKey: generationKeys.all(userId),
    queryFn: () => getGenerations(userId!),
    enabled: !!userId,
  });
}

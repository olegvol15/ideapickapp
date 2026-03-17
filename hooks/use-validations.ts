'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  saveValidation,
  deleteValidation,
  getValidations,
} from '@/services/db.service';
import { validationKeys } from '@/lib/api-keys';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

export function useGetValidations(userId: string | undefined) {
  return useQuery({
    queryKey: validationKeys.all(userId),
    queryFn: () => getValidations(userId!),
    enabled: !!userId,
  });
}

export function useSaveValidation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      description: string;
      productType: string;
      result: EnhancedValidationResult;
      competitors: Competitor[];
    }) => {
      if (!userId) return Promise.resolve('');
      return saveValidation({ userId, ...params });
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: validationKeys.all(userId) });
    },
  });
}

export function useDeleteValidation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!userId) return Promise.resolve();
      return deleteValidation(userId, id);
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: validationKeys.all(userId) });
    },
  });
}

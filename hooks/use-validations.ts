'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  saveValidation,
  deleteValidation,
  renameValidation,
  getValidations,
  updateValidation,
} from '@/services/db.service';
import { toast } from 'sonner';
import { validationKeys } from '@/lib/api-keys';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

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

export function useRenameValidation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) => {
      if (!userId) return Promise.resolve();
      return renameValidation(userId, id, description);
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

export function useUpdateValidation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      description,
      result,
      competitors,
    }: {
      id: string;
      description: string;
      result: EnhancedValidationResult;
      competitors: Competitor[];
    }) => {
      if (!userId) return Promise.resolve();
      return updateValidation(userId, id, description, result, competitors);
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: validationKeys.all(userId) });
    },
    onError: () => toast.error('Failed to update validation.'),
  });
}

export function useGetValidations(userId: string | undefined) {
  return useQuery({
    queryKey: validationKeys.all(userId),
    queryFn: () => getValidations(userId!),
    enabled: !!userId,
  });
}

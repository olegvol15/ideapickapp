'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveValidation, deleteValidation, renameValidation } from '@/services/db.service';
import { validationKeys } from '@/lib/api-keys';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

export function useSaveValidation(userId: string | undefined) {
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
      if (userId) queryClient.invalidateQueries({ queryKey: validationKeys.all(userId) });
    },
  });
}

export function useDeleteValidation(userId: string | undefined) {
  return useMutation({
    mutationFn: (id: string) => {
      if (!userId) return Promise.resolve();
      return deleteValidation(userId, id);
    },
  });
}

'use client';

import { useMutation } from '@tanstack/react-query';
import { saveValidation, deleteValidation } from '@/services/db.service';
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

export function useDeleteValidation(userId: string | undefined) {
  return useMutation({
    mutationFn: (id: string) => {
      if (!userId) return Promise.resolve();
      return deleteValidation(userId, id);
    },
  });
}
